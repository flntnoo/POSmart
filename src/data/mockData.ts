import type {
  AuditLog,
  Category,
  Customer,
  Inventory,
  NotificationLog,
  Outlet,
  Payment,
  Product,
  Subscription,
  Supplier,
  Transaction,
  TransactionDetail,
  User,
} from "@/types/posmart";

export const mockUsers: User[] = [
  {
    userId: "user-owner-001",
    nama: "Ayu Lestari",
    email: "owner@posmart.test",
    role: "owner",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
  },
  {
    userId: "user-admin-001",
    nama: "Rafi Nugroho",
    email: "admin@posmart.test",
    role: "admin",
    createdAt: "2026-06-02T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
  },
  {
    userId: "user-kasir-001",
    nama: "Mira Sari",
    email: "kasir@posmart.test",
    role: "kasir",
    createdAt: "2026-06-03T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
  },
];

export const demoWorkspaceUserIds = new Set(["user-owner-001", "user-admin-001", "user-kasir-001"]);

export function getWorkspaceOwnerId(userId?: string) {
  if (!userId) return undefined;
  return demoWorkspaceUserIds.has(userId) ? "user-owner-001" : userId;
}

export function getWorkspaceUserIds(userId?: string) {
  if (!userId) return undefined;
  return demoWorkspaceUserIds.has(userId) ? demoWorkspaceUserIds : new Set([userId]);
}

export const mockOutlets: Outlet[] = [
  {
    outletId: "outlet-kopi-main",
    userId: "user-owner-001",
    nama: "Kedai Kopi Senja - Pusat",
    alamat: "Jl. Melati No. 12, Jakarta Selatan",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    taxRate: 0,
    printReceiptAuto: false,
    lowStockAlert: true,
    dailyWhatsappReport: false,
    autoTax: false,
    createdAt: "2026-06-01T08:10:00.000Z",
    updatedAt: "2026-06-13T08:10:00.000Z",
  },
  {
    outletId: "outlet-kopi-branch",
    userId: "user-owner-001",
    nama: "Kedai Kopi Senja - Tebet",
    alamat: "Jl. Tebet Raya No. 8, Jakarta Selatan",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    taxRate: 0,
    printReceiptAuto: false,
    lowStockAlert: true,
    dailyWhatsappReport: false,
    autoTax: false,
    createdAt: "2026-06-04T08:10:00.000Z",
    updatedAt: "2026-06-13T08:10:00.000Z",
  },
];

export const mockCategories: Category[] = [
  { categoryId: "cat-minuman", nama: "Minuman" },
  { categoryId: "cat-makanan", nama: "Makanan" },
  { categoryId: "cat-snack", nama: "Snack" },
  { categoryId: "cat-retail", nama: "Retail" },
];

export const mockSuppliers: Supplier[] = [
  { supplierId: "supplier-roaster", nama: "Nusantara Roastery", kontak: "+62 812-1000-2000" },
  { supplierId: "supplier-bakery", nama: "Dapur Roti Ibu", kontak: "+62 812-3000-4000" },
  { supplierId: "supplier-packaging", nama: "Kemasan Jaya", kontak: "sales@kemasanjaya.test" },
];

export const mockProducts: Product[] = [
  {
    productId: "prod-kopi-susu",
    categoryId: "cat-minuman",
    supplierId: "supplier-roaster",
    outletId: "outlet-kopi-main",
    nama: "Kopi Susu Gula Aren",
    harga: 22000,
    sku: "KSGA-001",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-13T09:00:00.000Z",
  },
  {
    productId: "prod-americano",
    categoryId: "cat-minuman",
    supplierId: "supplier-roaster",
    outletId: "outlet-kopi-main",
    nama: "Americano",
    harga: 18000,
    sku: "AMR-001",
    createdAt: "2026-06-01T09:05:00.000Z",
    updatedAt: "2026-06-13T09:05:00.000Z",
  },
  {
    productId: "prod-croissant",
    categoryId: "cat-makanan",
    supplierId: "supplier-bakery",
    outletId: "outlet-kopi-main",
    nama: "Butter Croissant",
    harga: 24000,
    sku: "BCR-001",
    createdAt: "2026-06-01T09:10:00.000Z",
    updatedAt: "2026-06-13T09:10:00.000Z",
  },
  {
    productId: "prod-brownies",
    categoryId: "cat-snack",
    supplierId: "supplier-bakery",
    outletId: "outlet-kopi-branch",
    nama: "Brownies Slice",
    harga: 16000,
    sku: "BRW-001",
    createdAt: "2026-06-04T09:10:00.000Z",
    updatedAt: "2026-06-13T09:10:00.000Z",
  },
  {
    productId: "prod-beans",
    categoryId: "cat-retail",
    supplierId: "supplier-roaster",
    outletId: "outlet-kopi-main",
    nama: "Coffee Beans 250g",
    harga: 85000,
    sku: "CB250-001",
    createdAt: "2026-06-05T09:10:00.000Z",
    updatedAt: "2026-06-13T09:10:00.000Z",
  },
  {
    productId: "prod-cup",
    categoryId: "cat-retail",
    supplierId: "supplier-packaging",
    outletId: "outlet-kopi-branch",
    nama: "Reusable Cup",
    harga: 45000,
    sku: "CUP-001",
    createdAt: "2026-06-05T09:20:00.000Z",
    updatedAt: "2026-06-13T09:20:00.000Z",
  },
];

export const mockInventory: Inventory[] = [
  { inventoryId: "inv-001", productId: "prod-kopi-susu", outletId: "outlet-kopi-main", stok: 34, minStock: 10, updatedAt: "2026-06-13T11:00:00.000Z" },
  { inventoryId: "inv-002", productId: "prod-americano", outletId: "outlet-kopi-main", stok: 28, minStock: 10, updatedAt: "2026-06-13T11:00:00.000Z" },
  { inventoryId: "inv-003", productId: "prod-croissant", outletId: "outlet-kopi-main", stok: 8, minStock: 10, updatedAt: "2026-06-13T11:00:00.000Z" },
  { inventoryId: "inv-004", productId: "prod-brownies", outletId: "outlet-kopi-branch", stok: 12, minStock: 8, updatedAt: "2026-06-13T11:00:00.000Z" },
  { inventoryId: "inv-005", productId: "prod-beans", outletId: "outlet-kopi-main", stok: 5, minStock: 6, updatedAt: "2026-06-13T11:00:00.000Z" },
  { inventoryId: "inv-006", productId: "prod-cup", outletId: "outlet-kopi-branch", stok: 18, minStock: 5, updatedAt: "2026-06-13T11:00:00.000Z" },
];

export const mockCustomers: Customer[] = [
  { customerId: "customer-001", nama: "Dina Prameswari", telepon: "+62 812-9000-1000", email: "dina@example.test" },
  { customerId: "customer-002", nama: "Bima Santoso", telepon: "+62 813-2000-3000", email: "bima@example.test" },
  { customerId: "customer-003", nama: "Walk-in Customer" },
];

export const mockCategoryOwners: Record<string, string> = {
  "cat-minuman": "user-owner-001",
  "cat-makanan": "user-owner-001",
  "cat-snack": "user-owner-001",
  "cat-retail": "user-owner-001",
};

export const mockSupplierOwners: Record<string, string> = {
  "supplier-roaster": "user-owner-001",
  "supplier-bakery": "user-owner-001",
  "supplier-packaging": "user-owner-001",
};

export const mockCustomerOwners: Record<string, string> = {
  "customer-001": "user-owner-001",
  "customer-002": "user-owner-001",
  "customer-003": "user-owner-001",
};

export const lowStockNotificationKeys = new Set<string>([
  "user-owner-001|prod-beans|outlet-kopi-main",
]);

export function getLowStockNotificationKey(userId: string, productId: string, outletId: string) {
  return `${getWorkspaceOwnerId(userId) ?? userId}|${productId}|${outletId}`;
}

export const mockTransactions: Transaction[] = [
  {
    transactionId: "TRX-20260613-001",
    customerId: "customer-001",
    userId: "user-kasir-001",
    outletId: "outlet-kopi-main",
    tanggal: "2026-06-13T09:20:00.000Z",
    total: 68000,
    metode: "QRIS",
    status: "Sukses",
  },
  {
    transactionId: "TRX-20260613-002",
    customerId: "customer-002",
    userId: "user-kasir-001",
    outletId: "outlet-kopi-main",
    tanggal: "2026-06-13T12:10:00.000Z",
    total: 85000,
    metode: "Tunai",
    status: "Sukses",
  },
  {
    transactionId: "TRX-20260612-001",
    customerId: "customer-003",
    userId: "user-admin-001",
    outletId: "outlet-kopi-branch",
    tanggal: "2026-06-12T16:45:00.000Z",
    total: 77000,
    metode: "Transfer",
    status: "Pending",
  },
];

export const mockTransactionDetails: TransactionDetail[] = [
  { detailId: "detail-001", transactionId: "TRX-20260613-001", productId: "prod-kopi-susu", quantity: 2, subtotal: 44000 },
  { detailId: "detail-002", transactionId: "TRX-20260613-001", productId: "prod-croissant", quantity: 1, subtotal: 24000 },
  { detailId: "detail-003", transactionId: "TRX-20260613-002", productId: "prod-beans", quantity: 1, subtotal: 85000 },
  { detailId: "detail-004", transactionId: "TRX-20260612-001", productId: "prod-brownies", quantity: 2, subtotal: 32000 },
  { detailId: "detail-005", transactionId: "TRX-20260612-001", productId: "prod-cup", quantity: 1, subtotal: 45000 },
];

export const mockSubscriptions: Subscription[] = [
  {
    subscriptionId: "sub-001",
    userId: "user-owner-001",
    paket: "Basic",
    status: "active",
    startDate: "2026-06-01",
    endDate: "2026-07-01",
  },
];

export const mockPayments: Payment[] = [
  {
    paymentId: "pay-001",
    subscriptionId: "sub-001",
    jumlah: 299000,
    metode: "Midtrans QRIS",
    status: "success",
    paymentDate: "2026-06-01T10:00:00.000Z",
  },
];

export const mockNotificationLogs: NotificationLog[] = [
  {
    notifId: "notif-001",
    userId: "user-owner-001",
    pesan: "Subscription Basic aktif sampai 1 Juli 2026.",
    tipe: "activation",
    status: "sent",
    createdAt: "2026-06-01T10:05:00.000Z",
  },
  {
    notifId: "notif-002",
    userId: "user-owner-001",
    pesan: "Stok Coffee Beans 250g mulai menipis di Kedai Kopi Senja - Pusat.",
    tipe: "low_stock",
    status: "sent",
    createdAt: "2026-06-13T11:05:00.000Z",
  },
  {
    notifId: "notif-003",
    userId: "user-owner-001",
    pesan: "Subscription Basic akan berakhir pada 1 Juli 2026. Siapkan perpanjangan sebelum masa aktif habis.",
    tipe: "renewal",
    status: "sent",
    createdAt: "2026-06-16T08:00:00.000Z",
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    auditId: "audit-001",
    userId: "user-owner-001",
    aksi: "Membuat outlet Kedai Kopi Senja - Pusat",
    module: "outlets",
    createdAt: "2026-06-01T08:12:00.000Z",
  },
  {
    auditId: "audit-002",
    userId: "user-kasir-001",
    aksi: "Membuat transaksi TRX-20260613-001",
    module: "transactions",
    createdAt: "2026-06-13T09:20:10.000Z",
  },
];

export function getProductStock(productId: string, outletId?: string) {
  return mockInventory
    .filter((item) => item.productId === productId && (!outletId || item.outletId === outletId))
    .reduce((total, item) => total + item.stok, 0);
}

export function getWorkspaceOutletIds(userId?: string) {
  const ownerId = getWorkspaceOwnerId(userId);
  if (!ownerId) return undefined;
  return new Set(mockOutlets.filter((outlet) => outlet.userId === ownerId).map((outlet) => outlet.outletId));
}

export function belongsToWorkspaceOutlet(outletId: string | undefined, userId?: string) {
  const outletIds = getWorkspaceOutletIds(userId);
  if (!outletIds) return true;
  return Boolean(outletId && outletIds.has(outletId));
}
