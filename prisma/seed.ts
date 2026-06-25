import "../scripts/load-env";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function findOrCreateOutlet(input: { userId: number; nama: string; alamat: string }) {
  const existing = await prisma.outlet.findFirst({ where: { userId: input.userId, nama: input.nama } });
  if (existing) return existing;
  return prisma.outlet.create({ data: input });
}

async function findOrCreateCustomer(input: { ownerUserId: number; nama: string; telepon?: string; email?: string }) {
  const existing = await prisma.customer.findFirst({ where: { ownerUserId: input.ownerUserId, nama: input.nama } });
  if (existing) return existing;
  return prisma.customer.create({ data: input });
}

async function findOrCreateActiveSubscription(input: { userId: number; paket: "Free" | "Basic" | "Pro"; startDate: Date; endDate: Date }) {
  const existing = await prisma.subscription.findFirst({ where: { userId: input.userId, paket: input.paket, status: "active" } });
  if (existing) return existing;
  return prisma.subscription.create({
    data: {
      userId: input.userId,
      paket: input.paket,
      status: "active",
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

async function findOrCreatePayment(input: { subscriptionId: number; jumlah: number; metode: string; status: "success"; provider: string; externalReference: string; paymentDate: Date }) {
  const existing = await prisma.payment.findFirst({ where: { externalReference: input.externalReference } });
  if (existing) return existing;
  return prisma.payment.create({ data: input });
}

async function findOrCreateTransaction(input: Parameters<typeof prisma.transaction.create>[0]["data"]) {
  const existing = await prisma.transaction.findFirst({
    where: {
      userId: input.userId as number,
      outletId: input.outletId as number,
      metode: input.metode,
      status: input.status,
      total: input.total,
    },
  });
  if (existing) return existing;
  return prisma.transaction.create({ data: input });
}

async function findOrCreateAudit(input: { userId: number; module: string; aksi: string; entityType?: string; entityId?: string }) {
  const existing = await prisma.auditLog.findFirst({
    where: { userId: input.userId, module: input.module, aksi: input.aksi, entityType: input.entityType, entityId: input.entityId },
  });
  if (existing) return existing;
  return prisma.auditLog.create({ data: input });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@posmart.test" },
    update: {},
    create: {
      nama: "Ayu Lestari",
      email: "owner@posmart.test",
      passwordHash,
      role: "owner",
    },
  });

  await prisma.user.update({
    where: { userId: owner.userId },
    data: { ownerUserId: owner.userId },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@posmart.test" },
    update: {},
    create: {
      nama: "Rafi Nugroho",
      email: "admin@posmart.test",
      passwordHash,
      role: "admin",
      ownerUserId: owner.userId,
    },
  });

  const kasir = await prisma.user.upsert({
    where: { email: "kasir@posmart.test" },
    update: {},
    create: {
      nama: "Mira Sari",
      email: "kasir@posmart.test",
      passwordHash,
      role: "kasir",
      ownerUserId: owner.userId,
    },
  });

  const mainOutlet = await findOrCreateOutlet({
    userId: owner.userId,
    nama: "Kedai Kopi Senja - Pusat",
    alamat: "Jl. Melati No. 12, Jakarta Selatan",
  });

  const branchOutlet = await findOrCreateOutlet({
    userId: owner.userId,
    nama: "Kedai Kopi Senja - Tebet",
    alamat: "Jl. Tebet Raya No. 8, Jakarta Selatan",
  });

  const minuman = await prisma.category.upsert({
    where: { ownerUserId_nama: { ownerUserId: owner.userId, nama: "Minuman" } },
    update: {},
    create: { ownerUserId: owner.userId, nama: "Minuman" },
  });
  const makanan = await prisma.category.upsert({
    where: { ownerUserId_nama: { ownerUserId: owner.userId, nama: "Makanan" } },
    update: {},
    create: { ownerUserId: owner.userId, nama: "Makanan" },
  });
  const retail = await prisma.category.upsert({
    where: { ownerUserId_nama: { ownerUserId: owner.userId, nama: "Retail" } },
    update: {},
    create: { ownerUserId: owner.userId, nama: "Retail" },
  });

  const roaster = await prisma.supplier.upsert({
    where: { ownerUserId_nama: { ownerUserId: owner.userId, nama: "Nusantara Roastery" } },
    update: {},
    create: { ownerUserId: owner.userId, nama: "Nusantara Roastery", kontak: "+62 812-1000-2000" },
  });
  const bakery = await prisma.supplier.upsert({
    where: { ownerUserId_nama: { ownerUserId: owner.userId, nama: "Dapur Roti Ibu" } },
    update: {},
    create: { ownerUserId: owner.userId, nama: "Dapur Roti Ibu", kontak: "+62 812-3000-4000" },
  });

  const kopi = await prisma.product.upsert({
    where: { outletId_sku: { outletId: mainOutlet.outletId, sku: "KSGA-001" } },
    update: {},
    create: {
      categoryId: minuman.categoryId,
      supplierId: roaster.supplierId,
      outletId: mainOutlet.outletId,
      nama: "Kopi Susu Gula Aren",
      harga: 22000,
      sku: "KSGA-001",
    },
  });
  const croissant = await prisma.product.upsert({
    where: { outletId_sku: { outletId: mainOutlet.outletId, sku: "BCR-001" } },
    update: {},
    create: {
      categoryId: makanan.categoryId,
      supplierId: bakery.supplierId,
      outletId: mainOutlet.outletId,
      nama: "Butter Croissant",
      harga: 24000,
      sku: "BCR-001",
    },
  });
  const beans = await prisma.product.upsert({
    where: { outletId_sku: { outletId: mainOutlet.outletId, sku: "CB250-001" } },
    update: {},
    create: {
      categoryId: retail.categoryId,
      supplierId: roaster.supplierId,
      outletId: mainOutlet.outletId,
      nama: "Coffee Beans 250g",
      harga: 85000,
      sku: "CB250-001",
    },
  });

  await prisma.inventory.upsert({
    where: { productId_outletId: { productId: kopi.productId, outletId: mainOutlet.outletId } },
    update: {},
    create: { productId: kopi.productId, outletId: mainOutlet.outletId, stok: 34, minStock: 10 },
  });
  await prisma.inventory.upsert({
    where: { productId_outletId: { productId: croissant.productId, outletId: mainOutlet.outletId } },
    update: {},
    create: { productId: croissant.productId, outletId: mainOutlet.outletId, stok: 8, minStock: 10 },
  });
  await prisma.inventory.upsert({
    where: { productId_outletId: { productId: beans.productId, outletId: mainOutlet.outletId } },
    update: {},
    create: { productId: beans.productId, outletId: mainOutlet.outletId, stok: 5, minStock: 6 },
  });

  const walkIn = await findOrCreateCustomer({ ownerUserId: owner.userId, nama: "Walk-in Customer" });

  const subscription = await findOrCreateActiveSubscription({
    userId: owner.userId,
    paket: "Basic",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-07-01"),
  });

  await findOrCreatePayment({
    subscriptionId: subscription.subscriptionId,
    jumlah: 299000,
    metode: "Midtrans QRIS",
    status: "success",
    provider: "mock",
    externalReference: "seed-basic-2026-06",
    paymentDate: new Date("2026-06-01T10:00:00.000Z"),
  });

  const transaction = await findOrCreateTransaction({
    customerId: walkIn.customerId,
    userId: kasir.userId,
    outletId: mainOutlet.outletId,
    total: 68000,
    metode: "QRIS",
    status: "Sukses",
    details: {
      create: [
        { productId: kopi.productId, quantity: 2, unitPrice: 22000, subtotal: 44000 },
        { productId: croissant.productId, quantity: 1, unitPrice: 24000, subtotal: 24000 },
      ],
    },
  });

  const lowStockDedupeKey = `${owner.userId}|${beans.productId}|${mainOutlet.outletId}|low_stock`;
  await prisma.notificationLog.upsert({
    where: { dedupeKey: lowStockDedupeKey },
    update: {},
    create: {
      userId: owner.userId,
      tipe: "low_stock",
      status: "sent",
      dedupeKey: lowStockDedupeKey,
      pesan: "Stok Coffee Beans 250g mulai menipis di Kedai Kopi Senja - Pusat.",
    },
  });

  await findOrCreateAudit({ userId: owner.userId, module: "outlets", aksi: "Membuat outlet Kedai Kopi Senja - Pusat", entityType: "outlet", entityId: String(mainOutlet.outletId) });
  await findOrCreateAudit({ userId: admin.userId, module: "outlets", aksi: `Memiliki akses operasional outlet ${branchOutlet.nama}`, entityType: "outlet", entityId: String(branchOutlet.outletId) });
  await findOrCreateAudit({ userId: kasir.userId, module: "transactions", aksi: `Membuat transaksi ${transaction.transactionId}`, entityType: "transaction", entityId: String(transaction.transactionId) });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
