export type Role =
  | "Super Admin"
  | "Owner"
  | "Admin"
  | "Kasir";

export type Permission =
  | "Dashboard"
  | "POS / Kasir"
  | "Produk & Inventori"
  | "Transaksi"
  | "Pelanggan"
  | "Supplier"
  | "Team & Roles"
  | "Laporan & Analisis"
  | "Pengaturan";

export const rolePermissions: Record<Role, Permission[]> = {
  "Super Admin": [
    "Dashboard", "POS / Kasir", "Produk & Inventori", "Transaksi",
    "Pelanggan", "Supplier", "Team & Roles", "Laporan & Analisis", "Pengaturan",
  ],
  "Owner": [
    "Dashboard", "POS / Kasir", "Produk & Inventori", "Transaksi",
    "Pelanggan", "Supplier", "Team & Roles", "Laporan & Analisis", "Pengaturan",
  ],
  "Admin": [
    "Dashboard", "POS / Kasir", "Produk & Inventori", "Transaksi",
    "Pelanggan", "Supplier", "Laporan & Analisis", "Pengaturan",
  ],
  "Kasir": ["POS / Kasir", "Transaksi"],
};

export const roleBadge: Record<Role, { bg: string; text: string }> = {
  "Super Admin": { bg: "bg-red-100", text: "text-red-600" },
  "Owner": { bg: "bg-orange-100", text: "text-orange-600" },
  "Admin": { bg: "bg-green-100", text: "text-green-700" },
  "Kasir": { bg: "bg-blue-100", text: "text-blue-600" },
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinDate: string;
  avatarColor: [string, string];
  initials: string;
};
