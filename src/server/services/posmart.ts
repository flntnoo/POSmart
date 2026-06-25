import bcrypt from "bcryptjs";
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
import type { AnalyticsSummary, NotificationStatus, NotificationType, PaymentStatus, SubscriptionPackage } from "@/types/posmart";

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

type PaginationOptions = {
  enabled: boolean;
  page: number;
  limit: number;
  skip: number;
  take: number;
};

type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function optionalSearch(filters: URLSearchParams) {
  const search = filters.get("search")?.trim();
  return search || undefined;
}

function parsePositiveIntParam(value: string | null, field: string, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Parameter tidak valid", { [field]: "Harus berupa angka positif" });
  }
  return parsed;
}

function parsePagination(filters: URLSearchParams): PaginationOptions {
  const enabled = filters.has("page") || filters.has("limit");
  const page = parsePositiveIntParam(filters.get("page"), "page", 1);
  const limit = Math.min(parsePositiveIntParam(filters.get("limit"), "limit", 20), 100);
  return { enabled, page, limit, skip: (page - 1) * limit, take: limit };
}

function maybePaginated<T>(items: T[], total: number, pagination: PaginationOptions): T[] | PaginatedResult<T> {
  if (!pagination.enabled) return items;
  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

function parseSortOrder(filters: URLSearchParams): "asc" | "desc" {
  const sortOrder = (filters.get("sortOrder") ?? filters.get("sort_order") ?? "desc") as "asc" | "desc";
  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw new ApiError(400, "Parameter tidak valid", { sortOrder: "Gunakan asc atau desc" });
  }
  return sortOrder;
}

function parseSortBy<T extends string>(filters: URLSearchParams, allowed: readonly T[], fallback: T): T {
  const sortBy = filters.get("sortBy") ?? filters.get("sort_by") ?? fallback;
  if (!allowed.includes(sortBy as T)) {
    throw new ApiError(400, "Parameter tidak valid", { sortBy: `Gunakan salah satu: ${allowed.join(", ")}` });
  }
  return sortBy as T;
}

function parseDateParam(value: string | null, field: string, endOfDay = false) {
  if (!value) return undefined;
  const normalized = endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "Parameter tanggal tidak valid", { [field]: "Gunakan format tanggal yang valid" });
  }
  return parsed;
}

function parseDateRange(filters: URLSearchParams) {
  const startDate = parseDateParam(filters.get("startDate") ?? filters.get("start_date"), "startDate");
  const endDate = parseDateParam(filters.get("endDate") ?? filters.get("end_date"), "endDate", true);
  if (startDate && endDate && startDate > endDate) {
    throw new ApiError(400, "Parameter tanggal tidak valid", { startDate: "startDate tidak boleh setelah endDate" });
  }
  return startDate || endDate ? { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } : undefined;
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

export async function listOutlets(user: SessionUser, filters = new URLSearchParams()) {
  const pagination = parsePagination(filters);
  const search = optionalSearch(filters);
  const sortBy = parseSortBy(filters, ["createdAt", "nama"] as const, "createdAt");
  const sortOrder = parseSortOrder(filters);
  const where = {
    userId: ownerId(user),
    ...(search ? { OR: [{ nama: { contains: search, mode: "insensitive" as const } }, { alamat: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [outlets, total] = await Promise.all([
    prisma.outlet.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.outlet.count({ where }),
  ]);
  return maybePaginated(outlets.map(outletDto), total, pagination);
}

export async function getOutlet(user: SessionUser, id: number) {
  return outletDto(await ensureOutletAccess(id, user));
}

type OutletInput = {
  nama: string;
  alamat?: string;
  telepon?: string;
  timezone?: string;
  currency?: string;
  taxRate?: number;
  printReceiptAuto?: boolean;
  lowStockAlert?: boolean;
  dailyWhatsappReport?: boolean;
  autoTax?: boolean;
};

export async function createOutlet(user: SessionUser, input: OutletInput) {
  const outlet = await prisma.outlet.create({ data: { userId: ownerId(user), nama: input.nama, alamat: input.alamat } });
  await createAudit(prisma, user.userId, "outlets", `Membuat outlet ${outlet.nama}`, "outlet", String(outlet.outletId));
  return outletDto(outlet);
}

export async function updateOutlet(user: SessionUser, id: number, input: Partial<OutletInput>) {
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

export async function listCategories(user: SessionUser, filters = new URLSearchParams()) {
  const pagination = parsePagination(filters);
  const search = optionalSearch(filters);
  const sortOrder = parseSortOrder(filters);
  const where = {
    ownerUserId: ownerId(user),
    ...(search ? { nama: { contains: search, mode: "insensitive" as const } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { nama: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.category.count({ where }),
  ]);
  return maybePaginated(rows.map(categoryDto), total, pagination);
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

export async function listSuppliers(user: SessionUser, filters = new URLSearchParams()) {
  const pagination = parsePagination(filters);
  const search = optionalSearch(filters);
  const sortOrder = parseSortOrder(filters);
  const where = {
    ownerUserId: ownerId(user),
    ...(search ? { OR: [{ nama: { contains: search, mode: "insensitive" as const } }, { kontak: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { nama: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.supplier.count({ where }),
  ]);
  return maybePaginated(rows.map(supplierDto), total, pagination);
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
  const search = optionalSearch(filters);
  const pagination = parsePagination(filters);
  const sortBy = parseSortBy(filters, ["createdAt", "nama", "harga", "sku"] as const, "createdAt");
  const sortOrder = parseSortOrder(filters);

  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  const where = {
    outlet: { userId: ownerId(user) },
    ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
    ...(categoryId ? { categoryId: numericId(categoryId, "categoryId") } : {}),
    ...(search ? { OR: [{ nama: { contains: search, mode: "insensitive" as const } }, { sku: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.product.count({ where }),
  ]);
  return maybePaginated(rows.map(productDto), total, pagination);
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
  const status = filters.get("status") ?? undefined;
  const search = optionalSearch(filters);
  const pagination = parsePagination(filters);
  const sortBy = parseSortBy(filters, ["updatedAt", "stok", "minStock"] as const, "updatedAt");
  const sortOrder = parseSortOrder(filters);
  if (status && status !== "low_stock") throw new ApiError(400, "Parameter tidak valid", { status: "Gunakan low_stock jika ingin memfilter stok menipis" });
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  const where = {
    outlet: { userId: ownerId(user) },
    ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
    ...(productId ? { productId: numericId(productId, "productId") } : {}),
    ...(search ? { product: { nama: { contains: search, mode: "insensitive" as const } } } : {}),
  };
  const [rows, totalRows] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...(status === "low_stock" || !pagination.enabled ? {} : { skip: pagination.skip, take: pagination.take }),
    }),
    prisma.inventory.count({ where }),
  ]);
  const filteredRows = status === "low_stock" ? rows.filter((row) => row.stok <= row.minStock) : rows;
  const total = status === "low_stock" ? filteredRows.length : totalRows;
  const pageRows = status === "low_stock" && pagination.enabled ? filteredRows.slice(pagination.skip, pagination.skip + pagination.take) : filteredRows;
  return maybePaginated(pageRows.map(inventoryDto), total, pagination);
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

export async function listCustomers(user: SessionUser, filters = new URLSearchParams()) {
  const pagination = parsePagination(filters);
  const search = optionalSearch(filters);
  const sortBy = parseSortBy(filters, ["nama"] as const, "nama");
  const sortOrder = parseSortOrder(filters);
  const where = {
    ownerUserId: ownerId(user),
    ...(search ? { OR: [{ nama: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }, { telepon: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.customer.count({ where }),
  ]);
  return maybePaginated(rows.map(customerDto), total, pagination);
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
  const metode = filters.get("metode") ?? undefined;
  const status = filters.get("status") ?? undefined;
  const dateRange = parseDateRange(filters);
  const pagination = parsePagination(filters);
  const sortBy = parseSortBy(filters, ["tanggal", "total"] as const, "tanggal");
  const sortOrder = parseSortOrder(filters);
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);
  if (metode && !["Tunai", "Transfer", "QRIS", "Kartu"].includes(metode)) throw new ApiError(400, "Parameter tidak valid", { metode: "Metode pembayaran tidak valid" });
  if (status && !["Sukses", "Pending", "Batal"].includes(status)) throw new ApiError(400, "Parameter tidak valid", { status: "Status transaksi tidak valid" });
  const where = {
    outlet: { userId: ownerId(user) },
    ...(user.role === "kasir" ? { userId: user.userId } : {}),
    ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
    ...(customerId ? { customerId: numericId(customerId, "customerId") } : {}),
    ...(metode ? { metode: metode as "Tunai" | "Transfer" | "QRIS" | "Kartu" } : {}),
    ...(status ? { status: status as "Sukses" | "Pending" | "Batal" } : {}),
    ...(dateRange ? { tanggal: dateRange } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.transaction.count({ where }),
  ]);
  return maybePaginated(rows.map(transactionDto), total, pagination);
}

export async function getTransaction(user: SessionUser, id: number) {
  const row = await prisma.transaction.findFirst({
    where: {
      transactionId: id,
      outlet: { userId: ownerId(user) },
      ...(user.role === "kasir" ? { userId: user.userId } : {}),
    },
    include: { details: { include: { product: true } } },
  });
  if (!row) throw new ApiError(404, "Transaksi tidak ditemukan");
  return {
    transaction: transactionDto(row),
    details: row.details.map((detail) => ({
      ...transactionDetailDto(detail),
      unitPrice: Number(detail.unitPrice),
      product: productDto(detail.product),
    })),
  };
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
  }, { isolationLevel: "Serializable" });

  return transactionDto(row);
}

export async function subscriptionPlans() {
  return [
    { paket: "Free" as SubscriptionPackage, price: 0 },
    { paket: "Basic" as SubscriptionPackage, price: 299000 },
    { paket: "Pro" as SubscriptionPackage, price: 599000 },
  ];
}

function subscriptionPrice(paket: SubscriptionPackage) {
  if (paket === "Basic") return 299000;
  if (paket === "Pro") return 599000;
  return 0;
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
  const row = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId: ownerId(user),
        paket: input.paket,
        status: input.paket === "Free" ? "active" : "pending",
        startDate: now,
        endDate,
      },
    });

    if (input.paket === "Free") {
      await tx.notificationLog.create({
        data: {
          userId: ownerId(user),
          tipe: "activation",
          status: "sent",
          pesan: "Subscription Free aktif.",
        },
      });
    } else {
      const amount = subscriptionPrice(input.paket);
      await tx.payment.create({
        data: {
          subscriptionId: subscription.subscriptionId,
          jumlah: amount,
          metode: "mock",
          status: "pending",
          provider: "mock",
        },
      });
      await tx.notificationLog.create({
        data: {
          userId: ownerId(user),
          tipe: "system",
          status: "pending",
          pesan: `Pembayaran paket ${input.paket} sebesar ${amount} menunggu simulasi pembayaran.`,
        },
      });
    }

    await createAudit(tx, user.userId, "subscriptions", `Memilih paket ${input.paket}`, "subscription", String(subscription.subscriptionId));
    return subscription;
  });
  return subscriptionDto(row);
}

export async function listPayments(user: SessionUser, subscriptionId?: string) {
  return listPaymentsWithFilters(user, new URLSearchParams(subscriptionId ? { subscriptionId } : undefined));
}

export async function listPaymentsWithFilters(user: SessionUser, filters: URLSearchParams) {
  const subscriptionId = filters.get("subscriptionId") ?? filters.get("subscription_id") ?? undefined;
  const status = filters.get("status") ?? undefined;
  const dateRange = parseDateRange(filters);
  const pagination = parsePagination(filters);
  const sortBy = parseSortBy(filters, ["paymentDate", "jumlah", "status"] as const, "paymentDate");
  const sortOrder = parseSortOrder(filters);
  if (status && !["pending", "success", "failed", "expired"].includes(status)) throw new ApiError(400, "Parameter tidak valid", { status: "Status payment tidak valid" });
  if (subscriptionId) {
    const subscription = await prisma.subscription.findFirst({ where: { subscriptionId: numericId(subscriptionId, "subscriptionId"), userId: ownerId(user) } });
    if (!subscription) throw new ApiError(404, "Subscription tidak ditemukan");
  }
  const where = {
    subscription: { userId: ownerId(user) },
    ...(subscriptionId ? { subscriptionId: numericId(subscriptionId, "subscriptionId") } : {}),
    ...(status ? { status: status as PaymentStatus } : {}),
    ...(dateRange ? { paymentDate: dateRange } : {}),
  };
  const rows = await prisma.payment.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
  });
  const total = await prisma.payment.count({ where });
  return maybePaginated(rows.map(paymentDto), total, pagination);
}

export async function createPayment(user: SessionUser, input: { subscriptionId: string; jumlah: number; metode?: string; status?: PaymentStatus }) {
  const subscriptionId = numericId(input.subscriptionId, "subscriptionId");
  const status = input.status ?? "pending";
  const row = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findFirst({ where: { subscriptionId, userId: ownerId(user) } });
    if (!subscription) throw new ApiError(404, "Subscription tidak ditemukan");
    const payment = await tx.payment.create({
      data: {
        subscriptionId,
        jumlah: input.jumlah,
        metode: input.metode,
        status,
        provider: "mock",
      },
    });
    if (status === "success") {
      await tx.subscription.update({ where: { subscriptionId }, data: { status: "active" } });
      await tx.notificationLog.create({
        data: {
          userId: ownerId(user),
          tipe: "activation",
          status: "sent",
          pesan: `Subscription ${subscription.paket} berhasil diaktifkan.`,
        },
      });
    } else if (status === "pending") {
      await tx.notificationLog.create({
        data: {
          userId: ownerId(user),
          tipe: "system",
          status: "pending",
          pesan: `Pembayaran subscription ${subscription.paket} menunggu simulasi pembayaran.`,
        },
      });
    }
    await createAudit(tx, user.userId, "payments", `Membuat payment ${payment.paymentId}`, "payment", String(payment.paymentId));
    return payment;
  });
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

export async function listNotifications(user: SessionUser, filters = new URLSearchParams()) {
  const tipe = filters.get("tipe") ?? filters.get("type") ?? undefined;
  const status = filters.get("status") ?? undefined;
  const search = optionalSearch(filters);
  const dateRange = parseDateRange(filters);
  const pagination = parsePagination(filters);
  const sortOrder = parseSortOrder(filters);
  if (tipe && !["activation", "low_stock", "renewal", "system"].includes(tipe)) throw new ApiError(400, "Parameter tidak valid", { tipe: "Tipe notifikasi tidak valid" });
  if (status && !["pending", "sent", "failed"].includes(status)) throw new ApiError(400, "Parameter tidak valid", { status: "Status notifikasi tidak valid" });
  const where = {
    userId: ownerId(user),
    ...(tipe ? { tipe: tipe as NotificationType } : {}),
    ...(status ? { status: status as NotificationStatus } : {}),
    ...(search ? { pesan: { contains: search, mode: "insensitive" as const } } : {}),
    ...(dateRange ? { createdAt: dateRange } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.notificationLog.count({ where }),
  ]);
  return maybePaginated(rows.map(notificationDto), total, pagination);
}

export async function createNotification(user: SessionUser, input: { userId?: string; pesan: string; tipe?: "activation" | "low_stock" | "renewal" | "system"; status?: "pending" | "sent" | "failed" }) {
  const targetUserId = input.userId ? numericId(input.userId, "userId") : ownerId(user);
  await ensureWorkspaceUserAccess(targetUserId, user);
  const row = await prisma.notificationLog.create({ data: { userId: targetUserId, pesan: input.pesan, tipe: input.tipe ?? "system", status: input.status ?? "sent" } });
  return notificationDto(row);
}

export async function listAuditLogs(user: SessionUser, filters: URLSearchParams) {
  const moduleName = filters.get("module") ?? undefined;
  const entityType = filters.get("entityType") ?? filters.get("entity_type") ?? undefined;
  const search = optionalSearch(filters);
  const dateRange = parseDateRange(filters);
  const pagination = parsePagination(filters);
  const sortOrder = parseSortOrder(filters);
  const where = {
    user: { OR: [{ userId: ownerId(user) }, { ownerUserId: ownerId(user) }] },
    ...(moduleName ? { module: moduleName } : {}),
    ...(entityType ? { entityType } : {}),
    ...(search ? { OR: [{ aksi: { contains: search, mode: "insensitive" as const } }, { module: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(dateRange ? { createdAt: dateRange } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      ...(pagination.enabled ? { skip: pagination.skip, take: pagination.take } : {}),
    }),
    prisma.auditLog.count({ where }),
  ]);
  return maybePaginated(rows.map(auditLogDto), total, pagination);
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
  const dateRange = parseDateRange(filters);
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);

  const transactions = await prisma.transaction.findMany({
    where: {
      outlet: { userId: ownerId(user) },
      status: "Sukses",
      ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
      ...(dateRange ? { tanggal: dateRange } : {}),
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

export async function analyticsOutletPerformance(user: SessionUser, filters: URLSearchParams) {
  const outletId = filters.get("outletId") ?? filters.get("outlet_id") ?? undefined;
  const dateRange = parseDateRange(filters);
  if (outletId) await ensureOutletAccess(numericId(outletId, "outletId"), user);

  const where = {
    outlet: { userId: ownerId(user) },
    status: "Sukses" as const,
    ...(outletId ? { outletId: numericId(outletId, "outletId") } : {}),
    ...(dateRange ? { tanggal: dateRange } : {}),
  };

  const grouped = await prisma.transaction.groupBy({
    by: ["outletId"],
    where,
    _count: { transactionId: true },
    _sum: { total: true },
    orderBy: { outletId: "asc" },
  });

  const outlets = await prisma.outlet.findMany({
    where: { userId: ownerId(user), outletId: { in: grouped.map((row) => row.outletId) } },
  });
  const outletMap = new Map(outlets.map((outlet) => [outlet.outletId, outlet]));

  return grouped.map((row) => {
    const totalRevenue = Number(row._sum.total ?? 0);
    const transactionCount = row._count.transactionId;
    const outlet = outletMap.get(row.outletId);
    return {
      outletId: String(row.outletId),
      nama: outlet?.nama ?? `Outlet ${row.outletId}`,
      totalRevenue,
      transactionCount,
      averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
    };
  });
}
