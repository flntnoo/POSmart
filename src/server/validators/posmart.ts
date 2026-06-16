import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "kasir"]);
export const idStringSchema = z.string().regex(/^\d+$/, "ID harus berupa angka");

export const registerSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.email("Email tidak valid").trim().toLowerCase(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: z.email("Email tidak valid").trim().toLowerCase(),
  password: z.string().min(1, "Password wajib diisi"),
  role: roleSchema.optional(),
});

export const profileUpdateSchema = z.object({
  nama: z.string().trim().min(1).optional(),
  email: z.email().trim().toLowerCase().optional(),
});

export const outletCreateSchema = z.object({
  nama: z.string().trim().min(1, "Nama outlet wajib diisi"),
  alamat: z.string().trim().optional(),
});
export const outletUpdateSchema = outletCreateSchema.partial();

export const categoryCreateSchema = z.object({ nama: z.string().trim().min(1, "Nama kategori wajib diisi") });
export const categoryUpdateSchema = categoryCreateSchema.partial();

export const supplierCreateSchema = z.object({
  nama: z.string().trim().min(1, "Nama supplier wajib diisi"),
  kontak: z.string().trim().optional(),
});
export const supplierUpdateSchema = supplierCreateSchema.partial();

export const productCreateSchema = z.object({
  categoryId: idStringSchema.optional(),
  supplierId: idStringSchema.optional(),
  outletId: idStringSchema.optional(),
  nama: z.string().trim().min(1, "Nama produk wajib diisi"),
  harga: z.number().min(0, "Harga tidak boleh negatif"),
  sku: z.string().trim().optional(),
});
export const productUpdateSchema = productCreateSchema.partial();

export const inventoryCreateSchema = z.object({
  productId: idStringSchema,
  outletId: idStringSchema,
  stok: z.number().int().min(0, "Stok tidak boleh negatif"),
  minStock: z.number().int().min(0).optional(),
});
export const inventoryAdjustSchema = z.object({
  productId: idStringSchema,
  outletId: idStringSchema,
  quantity: z.number().int().min(0, "Jumlah stok tidak boleh negatif"),
  type: z.enum(["in", "out", "set"]),
});

export const customerCreateSchema = z.object({
  nama: z.string().trim().min(1, "Nama pelanggan wajib diisi"),
  telepon: z.string().trim().optional(),
  email: z.email("Email tidak valid").trim().optional().or(z.literal("")),
});
export const customerUpdateSchema = customerCreateSchema.partial();

export const transactionCreateSchema = z.object({
  customerId: idStringSchema.optional(),
  outletId: idStringSchema,
  metode: z.enum(["Tunai", "Transfer", "QRIS", "Kartu"]),
  status: z.enum(["Sukses", "Pending", "Batal"]).optional(),
  items: z.array(z.object({
    productId: idStringSchema,
    quantity: z.number().int().positive("Quantity harus lebih dari 0"),
  })).min(1, "Minimal satu item transaksi"),
});

export const subscriptionCreateSchema = z.object({
  paket: z.enum(["Free", "Basic", "Pro"]),
});

export const paymentCreateSchema = z.object({
  subscriptionId: idStringSchema,
  jumlah: z.number().min(0, "Jumlah pembayaran tidak boleh negatif"),
  metode: z.string().trim().optional(),
  status: z.enum(["pending", "success", "failed", "expired"]).optional(),
});

export const paymentStatusSchema = z.object({
  status: z.enum(["pending", "success", "failed", "expired"]),
});

export const notificationCreateSchema = z.object({
  userId: idStringSchema.optional(),
  pesan: z.string().trim().min(1, "Pesan notifikasi wajib diisi"),
  tipe: z.enum(["activation", "low_stock", "renewal", "system"]).optional(),
  status: z.enum(["pending", "sent", "failed"]).optional(),
});

export const auditCreateSchema = z.object({
  userId: idStringSchema.optional(),
  aksi: z.string().trim().min(1, "Aksi audit wajib diisi"),
  module: z.string().trim().min(1, "Module audit wajib diisi"),
});
