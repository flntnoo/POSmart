import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api-response";
import { toSessionUser, type SessionUser } from "@/lib/auth";
import {
  auditLogDto,
  categoryDto,
  customerDto,
  inventoryDto,
  notificationDto,
  outletDto,
  paymentDto,
  productDto,
  supplierDto,
  subscriptionDto,
  transactionDetailDto,
  transactionDto,
  userDto,
} from "@/server/dto/posmart";
import type { AnalyticsSummary, PaymentStatus, SubscriptionPackage } from "@/types/posmart";

type PrismaTx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function numericId(value: string | undefined, field = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "ID tidak valid", { [field]: "ID harus berupa angka positif" });
  }
  return id;
}

function ownerId(user: SessionUser) {
  return user.ownerUserId;
}

async function ensureOutletAccess(outletId: number, user: SessionUser, db: PrismaTx = prisma) {
  const outlet = await db.outlet.findFirst({ where: { outletId, userId: ownerId(user) } });
  if (!outlet) throw new ApiError(404, "Outlet tidak ditemukan");
  return outlet;
}

async function ensureWorkspaceUserAccess(userId: number, user: SessionUser, db: PrismaTx = prisma) {
  const workspaceUser = await db.user.findFirst({
    where: {
      userId,
      OR: [{ userId: ownerId(user) }, { ownerUserId: ownerId(user) }],
    },
  });
  if (!workspaceUser) throw new ApiError(403, "Akses ditolak");
  return workspaceUser;
}

async function ensureProductOutletAccess(productId: number, outletId: number, user: SessionUser, db: PrismaTx = prisma) {
  const product = await db.product.findFirst({
    where: { productId, outletId, outlet: { userId: ownerId(user) } },
  });
  if (!product) throw new ApiError(404, "Produk tidak ditemukan di outlet ini");
  return product;
}

async function createAudit(db: PrismaTx, userId: number, module: string, aksi: string, entityType?: string, entityId?: string) {
  await db.auditLog.create({ data: { userId, module, aksi, entityType, entityId } });
}

async function createLowStockNotification(db: PrismaTx, ownerUserId: number, productId: number, outletId: number, stock: number) {
  const [product, outlet] = await Promise.all([
    db.product.findUnique({ where: { productId } }),
    db.outlet.findUnique({ where: { outletId } }),
  ]);
  if (!product || !outlet) return;

  const dedupeKey = `${ownerUserId}|${productId}|${outletId}|low_stock`;
  await db.notificationLog.upsert({
    where: { dedupeKey },
    update: {},
    create: {
      userId: ownerUserId,
      tipe: "low_stock",
      status: "sent",
      dedupeKey,
      pesan: `Stok ${product.nama} menipis di ${outlet.nama}. Sisa ${stock} unit.`,
    },
  });
}

async function validateCategory(categoryId: number | undefined, user: SessionUser) {
  if (!categoryId) return undefined;
  const category = await prisma.category.findFirst({ where: { categoryId, ownerUserId: ownerId(user) } });
  if (!category) throw new ApiError(404, "Kategori tidak ditemukan");
  return categoryId;
}

async function validateSupplier(supplierId: number | undefined, user: SessionUser) {
  if (!supplierId) return undefined;
  const supplier = await prisma.supplier.findFirst({ where: { supplierId, ownerUserId: ownerId(user) } });
  if (!supplier) throw new ApiError(404, "Supplier tidak ditemukan");
  return supplierId;
}

export async function registerUser(input: { nama: string; email: string; password: string; role?: SessionUser["role"] }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "Email sudah digunakan", { email: "Email sudah terdaftar" });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const role = input.role ?? "owner";
  const user = await prisma.user.create({
    data: {
      nama: input.nama,
      email: input.email,
      passwordHash,
      role,
    },
  });

  const resolved = await prisma.user.update({
    where: { userId: user.userId },
    data: { ownerUserId: role === "owner" ? user.userId : user.userId },
  });

  await createAudit(prisma, resolved.userId, "auth", "Registrasi user baru", "user", String(resolved.userId));
  return { user: userDto(resolved), sessionUser: toSessionUser(resolved) };
}

export async function loginUser(input: { email: string; password: string; role?: SessionUser["role"] }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new ApiError(401, "Email atau password salah", { email: "Email tidak terdaftar" });
  if (input.role && user.role !== input.role) {
    throw new ApiError(403, "Role tidak sesuai", { role: "Akun tidak memiliki akses role tersebut" });
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Email atau password salah", { password: "Password salah" });

  await createAudit(prisma, user.userId, "auth", "Login berhasil", "user", String(user.userId));
  return { user: userDto(user), sessionUser: toSessionUser(user) };
}

export async function updateProfile(user: SessionUser, input: { nama?: string; email?: string }) {
  if (input.email) {
    const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { userId: user.userId } } });
    if (existing) throw new ApiError(409, "Email sudah digunakan", { email: "Email sudah terdaftar" });
  }
  const updated = await prisma.user.update({ where: { userId: user.userId }, data: input });
  return userDto(updated);
}

export async function listOutlets(user: SessionUser) {
  const outlets = await prisma.outlet.findMany({ where: { userId: ownerId(user) }, orderBy: { createdAt: "desc" } });
  return outlets.map(outletDto);
}

export async function getOutlet(user: SessionUser, id: number) {
  return outletDto(await ensureOutletAccess(id, user));
}

export async function createOutlet(user: SessionUser, input: { nama: string; alamat?: string }) {
  const outlet = await prisma.outlet.create({ data: { userId: ownerId(user), nama: input.nama, alamat: input.alamat } });
  await createAudit(prisma, user.userId, "outlets", `Membuat outlet ${outlet.nama}`, "outlet", String(outlet.outletId));
  return outletDto(outlet);
}

export async function updateOutlet(user: SessionUser, id: number, input: { nama?: string; alamat?: string }) {
  await ensureOutletAccess(id, user);
  const outlet = await prisma.outlet.update({ where: { outletId: id }, data: input });
  await createAudit(prisma, user.userId, "outlets", `Memperbarui outlet ${outlet.nama}`, "outlet", String(outlet.outletId));
  return outletDto(outlet);
}

export async function deleteOutlet(user: SessionUser, id: number) {
  const outlet = await ensureOutletAccess(id, user);
  const dependencies = await prisma.transaction.count({ where: { outletId: id } });
  if (dependencies > 0) throw new ApiError(409, "Outlet masih terhubung dengan transaksi");
  await prisma.outlet.delete({ where: { outletId: id } });
  await createAudit(prisma, user.userId, "outlets", `Menghapus outlet ${outlet.nama}`, "outlet", String(id));
  return { outletId: String(id) };
}

export async function listCategories(user: SessionUser) {
  const rows = await prisma.category.findMany({ where: { ownerUserId: ownerId(user) }, orderBy: { nama: "asc" } });
  return rows.map(categoryDto);
}

export async function getCategory(user: SessionUser, id: number) {
  const row = await prisma.category.findFirst({ where: { categoryId: id, ownerUserId: ownerId(user) } });
  if (!row) throw new ApiError(404, "Kategori tidak ditemukan");
  return categoryDto(row);
}

export async function createCategory(user: SessionUser, input: { nama: string }) {
  const row = await prisma.category.create({ data: { ownerUserId: ownerId(user), nama: input.nama } });
  await createAudit(prisma, user.userId, "categories", `Membuat kategori ${row.nama}`, "category", String(row.categoryId));
  return categoryDto(row);
}

export async function updateCategory(user: SessionUser, id: number, input: { nama?: string }) {
  const existing = await prisma.category.findFirst({ where: { categoryId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Kategori tidak ditemukan");
  const row = await prisma.category.update({ where: { categoryId: id }, data: input });
  await createAudit(prisma, user.userId, "categories", `Memperbarui kategori ${row.nama}`, "category", String(row.categoryId));
  return categoryDto(row);
}

export async function deleteCategory(user: SessionUser, id: number) {
  const existing = await prisma.category.findFirst({ where: { categoryId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Kategori tidak ditemukan");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new ApiError(409, "Kategori masih terhubung dengan produk");
  await prisma.category.delete({ where: { categoryId: id } });
  await createAudit(prisma, user.userId, "categories", `Menghapus kategori ${existing.nama}`, "category", String(id));
  return { categoryId: String(id) };
}

export async function listSuppliers(user: SessionUser) {
  const rows = await prisma.supplier.findMany({ where: { ownerUserId: ownerId(user) }, orderBy: { nama: "asc" } });
  return rows.map(supplierDto);
}

export async function getSupplier(user: SessionUser, id: number) {
  const row = await prisma.supplier.findFirst({ where: { supplierId: id, ownerUserId: ownerId(user) } });
  if (!row) throw new ApiError(404, "Supplier tidak ditemukan");
  return supplierDto(row);
}

export async function createSupplier(user: SessionUser, input: { nama: string; kontak?: string }) {
  const row = await prisma.supplier.create({ data: { ownerUserId: ownerId(user), nama: input.nama, kontak: input.kontak } });
  await createAudit(prisma, user.userId, "suppliers", `Membuat supplier ${row.nama}`, "supplier", String(row.supplierId));
  return supplierDto(row);
}

export async function updateSupplier(user: SessionUser, id: number, input: { nama?: string; kontak?: string }) {
  const existing = await prisma.supplier.findFirst({ where: { supplierId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Supplier tidak ditemukan");
  const row = await prisma.supplier.update({ where: { supplierId: id }, data: input });
  await createAudit(prisma, user.userId, "suppliers", `Memperbarui supplier ${row.nama}`, "supplier", String(row.supplierId));
  return supplierDto(row);
}

export async function deleteSupplier(user: SessionUser, id: number) {
  const existing = await prisma.supplier.findFirst({ where: { supplierId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Supplier tidak ditemukan");
  const count = await prisma.product.count({ where: { supplierId: id } });
  if (count > 0) throw new ApiError(409, "Supplier masih terhubung dengan produk");
  await prisma.supplier.delete({ where: { supplierId: id } });
  await createAudit(prisma, user.userId, "suppliers", `Menghapus supplier ${existing.nama}`, "supplier", String(id));
  return { supplierId: String(id) };
}

export async function listProducts(user: SessionUser, filters: URLSearchParams) {
  const outletId = filters.get("outletId") ?? filters.get("outlet_id") ?? undefined;
  const categoryId = filters.get("categoryId") ?? filters.get("category_id") ?? undefined;
  const search = filters.get("search") ?? undefined;

  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  const rows = await prisma.product.findMany({
    where: {
      outlet: { userId: ownerId(user) },
      ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
      ...(categoryId ? { categoryId: numericId(categoryId, "categoryId") } : {}),
      ...(search ? { OR: [{ nama: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(productDto);
}

export async function getProduct(user: SessionUser, id: number) {
  const row = await prisma.product.findFirst({ where: { productId: id, outlet: { userId: ownerId(user) } } });
  if (!row) throw new ApiError(404, "Produk tidak ditemukan");
  return productDto(row);
}

export async function createProduct(user: SessionUser, input: { categoryId?: string; supplierId?: string; outletId?: string; nama: string; harga: number; sku?: string }) {
  const outletId = input.outletId ? numericId(input.outletId, "outletId") : undefined;
  if (outletId) await ensureOutletAccess(outletId, user);
  const categoryId = await validateCategory(input.categoryId ? numericId(input.categoryId, "categoryId") : undefined, user);
  const supplierId = await validateSupplier(input.supplierId ? numericId(input.supplierId, "supplierId") : undefined, user);
  const row = await prisma.product.create({ data: { outletId, categoryId, supplierId, nama: input.nama, harga: input.harga, sku: input.sku } });
  await createAudit(prisma, user.userId, "products", `Membuat produk ${row.nama}`, "product", String(row.productId));
  return productDto(row);
}

export async function updateProduct(user: SessionUser, id: number, input: { categoryId?: string; supplierId?: string; outletId?: string; nama?: string; harga?: number; sku?: string }) {
  await getProduct(user, id);
  const outletId = input.outletId ? numericId(input.outletId, "outletId") : undefined;
  if (outletId) await ensureOutletAccess(outletId, user);
  const categoryId = await validateCategory(input.categoryId ? numericId(input.categoryId, "categoryId") : undefined, user);
  const supplierId = await validateSupplier(input.supplierId ? numericId(input.supplierId, "supplierId") : undefined, user);
  const row = await prisma.product.update({ where: { productId: id }, data: { ...input, outletId, categoryId, supplierId } });
  await createAudit(prisma, user.userId, "products", `Memperbarui produk ${row.nama}`, "product", String(row.productId));
  return productDto(row);
}

export async function deleteProduct(user: SessionUser, id: number) {
  const product = await prisma.product.findFirst({ where: { productId: id, outlet: { userId: ownerId(user) } } });
  if (!product) throw new ApiError(404, "Produk tidak ditemukan");
  const count = await prisma.transactionDetail.count({ where: { productId: id } });
  if (count > 0) throw new ApiError(409, "Produk masih terhubung dengan transaksi");
  await prisma.product.delete({ where: { productId: id } });
  await createAudit(prisma, user.userId, "products", `Menghapus produk ${product.nama}`, "product", String(id));
  return { productId: String(id) };
}

export async function listInventory(user: SessionUser, filters: URLSearchParams) {
  const outletId = filters.get("outletId") ?? filters.get("outlet_id") ?? undefined;
  const productId = filters.get("productId") ?? filters.get("product_id") ?? undefined;
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  const rows = await prisma.inventory.findMany({
    where: {
      outlet: { userId: ownerId(user) },
      ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
      ...(productId ? { productId: numericId(productId, "productId") } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(inventoryDto);
}

export async function createInventory(user: SessionUser, input: { productId: string; outletId: string; stok: number; minStock?: number }) {
  const productId = numericId(input.productId, "productId");
  const outletId = numericId(input.outletId, "outletId");
  await ensureOutletAccess(outletId, user);
  await ensureProductOutletAccess(productId, outletId, user);
  const row = await prisma.inventory.create({ data: { productId, outletId, stok: input.stok, minStock: input.minStock ?? 5 } });
  await createAudit(prisma, user.userId, "inventory", `Membuat inventory produk ${productId}`, "inventory", String(row.inventoryId));
  if (row.stok <= row.minStock) await createLowStockNotification(prisma, ownerId(user), productId, outletId, row.stok);
  return inventoryDto(row);
}

export async function adjustInventory(user: SessionUser, input: { productId: string; outletId: string; quantity: number; type: "in" | "out" | "set" }) {
  const productId = numericId(input.productId, "productId");
  const outletId = numericId(input.outletId, "outletId");
  await ensureOutletAccess(outletId, user);
  await ensureProductOutletAccess(productId, outletId, user);

  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.inventory.findUnique({ where: { productId_outletId: { productId, outletId } } });
    if (!current) throw new ApiError(404, "Inventory tidak ditemukan");

    if (input.type === "out") {
      const result = await tx.inventory.updateMany({
        where: { inventoryId: current.inventoryId, stok: { gte: input.quantity } },
        data: { stok: { decrement: input.quantity } },
      });
      if (result.count !== 1) throw new ApiError(400, "Validasi gagal", { stok: "Stok tidak boleh negatif" });
    } else {
      await tx.inventory.update({
        where: { inventoryId: current.inventoryId },
        data: input.type === "in" ? { stok: { increment: input.quantity } } : { stok: input.quantity },
      });
    }

    const updated = await tx.inventory.findUniqueOrThrow({ where: { inventoryId: current.inventoryId } });
    await createAudit(tx, user.userId, "inventory", `Menyesuaikan stok produk ${productId}`, "inventory", String(updated.inventoryId));
    if (updated.stok <= updated.minStock) await createLowStockNotification(tx, ownerId(user), productId, outletId, updated.stok);
    return updated;
  });

  return inventoryDto(row);
}

export async function lowStockInventory(user: SessionUser) {
  const rows = await prisma.inventory.findMany({ where: { outlet: { userId: ownerId(user) }, }, orderBy: { updatedAt: "desc" } });
  return rows.filter((row) => row.stok <= row.minStock).map(inventoryDto);
}

export async function listCustomers(user: SessionUser) {
  const rows = await prisma.customer.findMany({ where: { ownerUserId: ownerId(user) }, orderBy: { nama: "asc" } });
  return rows.map(customerDto);
}

export async function getCustomer(user: SessionUser, id: number) {
  const row = await prisma.customer.findFirst({ where: { customerId: id, ownerUserId: ownerId(user) } });
  if (!row) throw new ApiError(404, "Pelanggan tidak ditemukan");
  return customerDto(row);
}

export async function createCustomer(user: SessionUser, input: { nama: string; telepon?: string; email?: string }) {
  const row = await prisma.customer.create({ data: { ownerUserId: ownerId(user), nama: input.nama, telepon: input.telepon, email: input.email || undefined } });
  await createAudit(prisma, user.userId, "customers", `Membuat pelanggan ${row.nama}`, "customer", String(row.customerId));
  return customerDto(row);
}

export async function updateCustomer(user: SessionUser, id: number, input: { nama?: string; telepon?: string; email?: string }) {
  const existing = await prisma.customer.findFirst({ where: { customerId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Pelanggan tidak ditemukan");
  const row = await prisma.customer.update({ where: { customerId: id }, data: { ...input, email: input.email || undefined } });
  await createAudit(prisma, user.userId, "customers", `Memperbarui pelanggan ${row.nama}`, "customer", String(row.customerId));
  return customerDto(row);
}

export async function deleteCustomer(user: SessionUser, id: number) {
  const existing = await prisma.customer.findFirst({ where: { customerId: id, ownerUserId: ownerId(user) } });
  if (!existing) throw new ApiError(404, "Pelanggan tidak ditemukan");
  const count = await prisma.transaction.count({ where: { customerId: id } });
  if (count > 0) throw new ApiError(409, "Pelanggan masih terhubung dengan transaksi");
  await prisma.customer.delete({ where: { customerId: id } });
  await createAudit(prisma, user.userId, "customers", `Menghapus pelanggan ${existing.nama}`, "customer", String(id));
  return { customerId: String(id) };
}

export async function listTransactions(user: SessionUser, filters: URLSearchParams) {
  const outletId = filters.get("outletId") ?? filters.get("outlet_id") ?? undefined;
  const customerId = filters.get("customerId") ?? filters.get("customer_id") ?? undefined;
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  const rows = await prisma.transaction.findMany({
    where: {
      outlet: { userId: ownerId(user) },
      ...(user.role === "kasir" ? { userId: user.userId } : {}),
      ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
      ...(customerId ? { customerId: numericId(customerId, "customerId") } : {}),
    },
    orderBy: { tanggal: "desc" },
  });
  return rows.map(transactionDto);
}

export async function getTransaction(user: SessionUser, id: number) {
  const row = await prisma.transaction.findFirst({
    where: {
      transactionId: id,
      outlet: { userId: ownerId(user) },
      ...(user.role === "kasir" ? { userId: user.userId } : {}),
    },
    include: { details: true },
  });
  if (!row) throw new ApiError(404, "Transaksi tidak ditemukan");
  return { transaction: transactionDto(row), details: row.details.map(transactionDetailDto) };
}

export async function createTransaction(user: SessionUser, input: { customerId?: string; outletId: string; metode: "Tunai" | "Transfer" | "QRIS" | "Kartu"; status?: "Sukses" | "Pending" | "Batal"; items: Array<{ productId: string; quantity: number }> }) {
  const outletId = numericId(input.outletId, "outletId");
  const customerId = input.customerId ? numericId(input.customerId, "customerId") : undefined;
  const status = input.status ?? "Sukses";
  const quantitiesByProduct = new Map<number, number>();

  for (const item of input.items) {
    const productId = numericId(item.productId, "productId");
    quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) ?? 0) + item.quantity);
  }

  const normalizedItems = [...quantitiesByProduct.entries()].map(([productId, quantity]) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, "Validasi gagal", { quantity: "Quantity harus lebih dari 0" });
    }
    return { productId, quantity };
  });

  const row = await prisma.$transaction(async (tx) => {
    await ensureOutletAccess(outletId, user, tx);
    if (customerId) {
      const customer = await tx.customer.findFirst({ where: { customerId, ownerUserId: ownerId(user) } });
      if (!customer) throw new ApiError(404, "Pelanggan tidak ditemukan");
    }

    const detailInputs = [];
    let total = 0;

    for (const item of normalizedItems) {
      const product = await ensureProductOutletAccess(item.productId, outletId, user, tx);
      const inventory = await tx.inventory.findUnique({ where: { productId_outletId: { productId: item.productId, outletId } } });
      if (!inventory) throw new ApiError(404, `Inventory produk ${item.productId} tidak ditemukan`);
      if (status === "Sukses" && inventory.stok < item.quantity) {
        throw new ApiError(400, "Stok tidak mencukupi", { [String(item.productId)]: `Stok tersedia ${inventory.stok}` });
      }

      const unitPrice = Number(product.harga);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;
      detailInputs.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal, inventory });
    }

    const transaction = await tx.transaction.create({
      data: {
        customerId,
        userId: user.userId,
        outletId,
        total,
        metode: input.metode,
        status,
      },
    });

    for (const item of detailInputs) {
      await tx.transactionDetail.create({
        data: {
          transactionId: transaction.transactionId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        },
      });
      if (status === "Sukses") {
        const result = await tx.inventory.updateMany({
          where: { inventoryId: item.inventory.inventoryId, stok: { gte: item.quantity } },
          data: { stok: { decrement: item.quantity } },
        });
        if (result.count !== 1) {
          throw new ApiError(400, "Stok tidak mencukupi", { [String(item.productId)]: "Stok berubah, silakan coba lagi" });
        }
        const updated = await tx.inventory.findUniqueOrThrow({ where: { inventoryId: item.inventory.inventoryId } });
        if (updated.stok <= updated.minStock) {
          await createLowStockNotification(tx, ownerId(user), item.productId, outletId, updated.stok);
        }
      }
    }

    await createAudit(tx, user.userId, "transactions", `Membuat transaksi ${transaction.transactionId}`, "transaction", String(transaction.transactionId));
    return transaction;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return transactionDto(row);
}

export async function subscriptionPlans() {
  return [
    { paket: "Free" as SubscriptionPackage, price: 0 },
    { paket: "Basic" as SubscriptionPackage, price: 299000 },
    { paket: "Pro" as SubscriptionPackage, price: 599000 },
  ];
}

export async function currentSubscription(user: SessionUser) {
  const row = await prisma.subscription.findFirst({ where: { userId: ownerId(user) }, orderBy: { subscriptionId: "desc" } });
  if (!row) throw new ApiError(404, "Subscription tidak ditemukan");
  return subscriptionDto(row);
}

export async function listSubscriptions(user: SessionUser) {
  const rows = await prisma.subscription.findMany({ where: { userId: ownerId(user) }, orderBy: { subscriptionId: "desc" } });
  return rows.map(subscriptionDto);
}

export async function createSubscription(user: SessionUser, input: { paket: SubscriptionPackage }) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);
  const row = await prisma.subscription.create({
    data: {
      userId: ownerId(user),
      paket: input.paket,
      status: input.paket === "Free" ? "active" : "pending",
      startDate: now,
      endDate,
    },
  });
  await createAudit(prisma, user.userId, "subscriptions", `Memilih paket ${input.paket}`, "subscription", String(row.subscriptionId));
  return subscriptionDto(row);
}

export async function listPayments(user: SessionUser, subscriptionId?: string) {
  const rows = await prisma.payment.findMany({
    where: {
      subscription: { userId: ownerId(user) },
      ...(subscriptionId ? { subscriptionId: numericId(subscriptionId, "subscriptionId") } : {}),
    },
    orderBy: { paymentDate: "desc" },
  });
  return rows.map(paymentDto);
}

export async function createPayment(user: SessionUser, input: { subscriptionId: string; jumlah: number; metode?: string; status?: PaymentStatus }) {
  const subscriptionId = numericId(input.subscriptionId, "subscriptionId");
  const subscription = await prisma.subscription.findFirst({ where: { subscriptionId, userId: ownerId(user) } });
  if (!subscription) throw new ApiError(404, "Subscription tidak ditemukan");
  const row = await prisma.payment.create({
    data: {
      subscriptionId,
      jumlah: input.jumlah,
      metode: input.metode,
      status: input.status ?? "pending",
      provider: "mock",
    },
  });
  await createAudit(prisma, user.userId, "payments", `Membuat payment ${row.paymentId}`, "payment", String(row.paymentId));
  return paymentDto(row);
}

export async function updatePaymentStatus(user: SessionUser, paymentId: number, status: PaymentStatus) {
  const row = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { paymentId, subscription: { userId: ownerId(user) } }, include: { subscription: true } });
    if (!payment) throw new ApiError(404, "Payment tidak ditemukan");
    const updated = await tx.payment.update({ where: { paymentId }, data: { status, paymentDate: new Date() } });
    if (status === "success") {
      await tx.subscription.update({ where: { subscriptionId: payment.subscriptionId }, data: { status: "active" } });
      await tx.notificationLog.create({
        data: {
          userId: ownerId(user),
          tipe: "activation",
          status: "sent",
          pesan: `Subscription ${payment.subscription.paket} berhasil diaktifkan.`,
        },
      });
    }
    await createAudit(tx, user.userId, "payments", `Mengubah payment ${paymentId} menjadi ${status}`, "payment", String(paymentId));
    return updated;
  });
  return paymentDto(row);
}

export async function listNotifications(user: SessionUser) {
  const rows = await prisma.notificationLog.findMany({ where: { userId: ownerId(user) }, orderBy: { createdAt: "desc" } });
  return rows.map(notificationDto);
}

export async function createNotification(user: SessionUser, input: { userId?: string; pesan: string; tipe?: "activation" | "low_stock" | "renewal" | "system"; status?: "pending" | "sent" | "failed" }) {
  const targetUserId = input.userId ? numericId(input.userId, "userId") : ownerId(user);
  await ensureWorkspaceUserAccess(targetUserId, user);
  const row = await prisma.notificationLog.create({ data: { userId: targetUserId, pesan: input.pesan, tipe: input.tipe ?? "system", status: input.status ?? "sent" } });
  return notificationDto(row);
}

export async function listAuditLogs(user: SessionUser, filters: URLSearchParams) {
  const moduleName = filters.get("module") ?? undefined;
  const rows = await prisma.auditLog.findMany({
    where: {
      user: { OR: [{ userId: ownerId(user) }, { ownerUserId: ownerId(user) }] },
      ...(moduleName ? { module: moduleName } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(auditLogDto);
}

export async function getAuditLog(user: SessionUser, id: number) {
  const row = await prisma.auditLog.findFirst({ where: { auditId: id, user: { OR: [{ userId: ownerId(user) }, { ownerUserId: ownerId(user) }] } } });
  if (!row) throw new ApiError(404, "Audit log tidak ditemukan");
  return auditLogDto(row);
}

export async function createAuditLog(user: SessionUser, input: { userId?: string; aksi: string; module: string }) {
  const targetUserId = input.userId ? numericId(input.userId, "userId") : user.userId;
  await ensureWorkspaceUserAccess(targetUserId, user);
  const row = await prisma.auditLog.create({ data: { userId: targetUserId, aksi: input.aksi, module: input.module } });
  return auditLogDto(row);
}

export async function analyticsSummary(user: SessionUser, filters: URLSearchParams): Promise<AnalyticsSummary & { lowStockSummary: unknown[]; recentTransactions: unknown[] }> {
  const outletId = filters.get("outletId") ?? filters.get("outlet_id") ?? undefined;
  const startDate = filters.get("startDate") ?? filters.get("start_date") ?? undefined;
  const endDate = filters.get("endDate") ?? filters.get("end_date") ?? undefined;
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);

  const transactions = await prisma.transaction.findMany({
    where: {
      outlet: { userId: ownerId(user) },
      status: "Sukses",
      ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
      ...(startDate || endDate ? { tanggal: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) } } : {}),
    },
    include: { details: { include: { product: true } } },
    orderBy: { tanggal: "desc" },
  });

  const byProduct = new Map<number, { productId: string; nama: string; quantity: number; revenue: number }>();
  const trend = new Map<string, number>();
  for (const transaction of transactions) {
    const label = transaction.tanggal.toISOString().slice(0, 10);
    trend.set(label, (trend.get(label) ?? 0) + Number(transaction.total));
    for (const detail of transaction.details) {
      const current = byProduct.get(detail.productId) ?? { productId: String(detail.productId), nama: detail.product.nama, quantity: 0, revenue: 0 };
      current.quantity += detail.quantity;
      current.revenue += Number(detail.subtotal);
      byProduct.set(detail.productId, current);
    }
  }

  const lowStockRows = await prisma.inventory.findMany({ where: { outlet: { userId: ownerId(user) } }, orderBy: { updatedAt: "desc" }, take: 10 });
  const recentRows = await prisma.transaction.findMany({ where: { outlet: { userId: ownerId(user) } }, orderBy: { tanggal: "desc" }, take: 5 });

  return {
    totalPendapatan: transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0),
    jumlahTransaksi: transactions.length,
    produkTerlaris: [...byProduct.values()].sort((a, b) => b.quantity - a.quantity),
    trenPendapatan: [...trend.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => a.label.localeCompare(b.label)),
    lowStockSummary: lowStockRows.filter((row) => row.stok <= row.minStock).map(inventoryDto),
    recentTransactions: recentRows.map(transactionDto),
  };
}
