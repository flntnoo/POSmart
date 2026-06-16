import type {
  AuditLog,
  Category,
  Customer,
  Inventory,
  NotificationLog,
  Outlet,
  Payment,
  Product,
  Supplier,
  Subscription,
  Transaction,
  TransactionDetail,
  User,
} from "@/types/posmart";

function id(value: number) {
  return String(value);
}

function iso(value: Date) {
  return value.toISOString();
}

function date(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

export function userDto(input: {
  userId: number;
  nama: string;
  email: string;
  role: User["role"];
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    userId: id(input.userId),
    nama: input.nama,
    email: input.email,
    role: input.role,
    createdAt: iso(input.createdAt),
    updatedAt: iso(input.updatedAt),
  };
}

export function outletDto(input: { outletId: number; userId: number; nama: string; alamat: string | null; createdAt: Date; updatedAt: Date }): Outlet {
  return {
    outletId: id(input.outletId),
    userId: id(input.userId),
    nama: input.nama,
    alamat: input.alamat ?? undefined,
    createdAt: iso(input.createdAt),
    updatedAt: iso(input.updatedAt),
  };
}

export function categoryDto(input: { categoryId: number; nama: string }): Category {
  return { categoryId: id(input.categoryId), nama: input.nama };
}

export function supplierDto(input: { supplierId: number; nama: string; kontak: string | null }): Supplier {
  return { supplierId: id(input.supplierId), nama: input.nama, kontak: input.kontak ?? undefined };
}

export function productDto(input: { productId: number; categoryId: number | null; supplierId: number | null; outletId: number | null; nama: string; harga: unknown; sku: string | null; createdAt: Date; updatedAt: Date }): Product {
  return {
    productId: id(input.productId),
    categoryId: input.categoryId ? id(input.categoryId) : undefined,
    supplierId: input.supplierId ? id(input.supplierId) : undefined,
    outletId: input.outletId ? id(input.outletId) : undefined,
    nama: input.nama,
    harga: Number(input.harga),
    sku: input.sku ?? undefined,
    createdAt: iso(input.createdAt),
    updatedAt: iso(input.updatedAt),
  };
}

export function inventoryDto(input: { inventoryId: number; productId: number; outletId: number; stok: number; minStock: number; updatedAt: Date }): Inventory {
  return {
    inventoryId: id(input.inventoryId),
    productId: id(input.productId),
    outletId: id(input.outletId),
    stok: input.stok,
    minStock: input.minStock,
    updatedAt: iso(input.updatedAt),
  };
}

export function customerDto(input: { customerId: number; nama: string; telepon: string | null; email: string | null }): Customer {
  return {
    customerId: id(input.customerId),
    nama: input.nama,
    telepon: input.telepon ?? undefined,
    email: input.email ?? undefined,
  };
}

export function transactionDto(input: { transactionId: number; customerId: number | null; userId: number; outletId: number; tanggal: Date; total: unknown; metode: Transaction["metode"]; status: Transaction["status"] }): Transaction {
  return {
    transactionId: id(input.transactionId),
    customerId: input.customerId ? id(input.customerId) : undefined,
    userId: id(input.userId),
    outletId: id(input.outletId),
    tanggal: iso(input.tanggal),
    total: Number(input.total),
    metode: input.metode,
    status: input.status,
  };
}

export function transactionDetailDto(input: { detailId: number; transactionId: number; productId: number; quantity: number; subtotal: unknown }): TransactionDetail {
  return {
    detailId: id(input.detailId),
    transactionId: id(input.transactionId),
    productId: id(input.productId),
    quantity: input.quantity,
    subtotal: Number(input.subtotal),
  };
}

export function subscriptionDto(input: { subscriptionId: number; userId: number; paket: Subscription["paket"]; status: Subscription["status"]; startDate: Date | null; endDate: Date | null }): Subscription {
  return {
    subscriptionId: id(input.subscriptionId),
    userId: id(input.userId),
    paket: input.paket,
    status: input.status,
    startDate: date(input.startDate),
    endDate: date(input.endDate),
  };
}

export function paymentDto(input: { paymentId: number; subscriptionId: number; jumlah: unknown; metode: string | null; status: Payment["status"]; paymentDate: Date }): Payment {
  return {
    paymentId: id(input.paymentId),
    subscriptionId: id(input.subscriptionId),
    jumlah: Number(input.jumlah),
    metode: input.metode ?? undefined,
    status: input.status,
    paymentDate: iso(input.paymentDate),
  };
}

export function notificationDto(input: { notifId: number; userId: number; pesan: string; tipe: NotificationLog["tipe"]; status: NotificationLog["status"]; createdAt: Date }): NotificationLog {
  return {
    notifId: id(input.notifId),
    userId: id(input.userId),
    pesan: input.pesan,
    tipe: input.tipe,
    status: input.status,
    createdAt: iso(input.createdAt),
  };
}

export function auditLogDto(input: { auditId: number; userId: number; aksi: string; module: string; createdAt: Date }): AuditLog {
  return {
    auditId: id(input.auditId),
    userId: id(input.userId),
    aksi: input.aksi,
    module: input.module,
    createdAt: iso(input.createdAt),
  };
}
