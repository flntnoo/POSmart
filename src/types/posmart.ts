export type UserRole = "owner" | "admin" | "kasir";

export type SubscriptionPackage = "Free" | "Basic" | "Pro";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";
export type PaymentStatus = "pending" | "success" | "failed" | "expired";
export type NotificationType = "activation" | "low_stock" | "renewal" | "system";
export type NotificationStatus = "pending" | "sent" | "failed";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
};

export type User = {
  userId: string;
  nama: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Outlet = {
  outletId: string;
  userId: string;
  nama: string;
  alamat?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  categoryId: string;
  nama: string;
};

export type Supplier = {
  supplierId: string;
  nama: string;
  kontak?: string;
};

export type Product = {
  productId: string;
  categoryId?: string;
  supplierId?: string;
  outletId?: string;
  nama: string;
  harga: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
};

export type Inventory = {
  inventoryId: string;
  productId: string;
  outletId: string;
  stok: number;
  minStock: number;
  updatedAt: string;
};

export type Customer = {
  customerId: string;
  nama: string;
  telepon?: string;
  email?: string;
};

export type Transaction = {
  transactionId: string;
  customerId?: string;
  userId: string;
  outletId: string;
  tanggal: string;
  total: number;
  metode: "Tunai" | "Transfer" | "QRIS" | "Kartu";
  status: "Sukses" | "Pending" | "Batal";
};

export type TransactionDetail = {
  detailId: string;
  transactionId: string;
  productId: string;
  quantity: number;
  subtotal: number;
};

export type Subscription = {
  subscriptionId: string;
  userId: string;
  paket: SubscriptionPackage;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
};

export type Payment = {
  paymentId: string;
  subscriptionId: string;
  jumlah: number;
  metode?: string;
  status: PaymentStatus;
  paymentDate: string;
};

export type NotificationLog = {
  notifId: string;
  userId: string;
  pesan: string;
  tipe: NotificationType;
  status: NotificationStatus;
  createdAt: string;
};

export type AuditLog = {
  auditId: string;
  userId: string;
  aksi: string;
  module: string;
  createdAt: string;
};

export type AnalyticsSummary = {
  totalPendapatan: number;
  jumlahTransaksi: number;
  produkTerlaris: Array<{
    productId: string;
    nama: string;
    quantity: number;
    revenue: number;
  }>;
  trenPendapatan: Array<{
    label: string;
    total: number;
  }>;
};
