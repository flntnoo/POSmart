import type { Product, Supplier as DomainSupplier } from "@/types/posmart";
import { mockProducts, mockSuppliers as sourceSuppliers } from "@/data/mockData";

export type SupplierStatus = "Lunas" | "Hutang";
export type SupplierTx = { name: string; date: string; amount: number };

export type Supplier = {
  id: string;
  name: string;
  abbr: string;
  logoColor: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  totalPurchases: number;
  productCount: number;
  debt: number;
  lastOrder: string;
  joinDate: string;
  status: SupplierStatus;
  recentTx: SupplierTx[];
};

const LOGO_COLORS = ["#FF6B00", "#374151", "#1D4ED8", "#059669", "#7C3AED"];

export function toSupplierView(supplier: DomainSupplier, index: number, productsSource: Product[] = mockProducts): Supplier {
  const products = productsSource.filter((product) => product.supplierId === supplier.supplierId);
  const totalPurchases = products.reduce((sum, product) => sum + product.harga * 20, 0);
  const debt = index === 1 ? 450000 : 0;
  const [phoneOrEmail = "-", emailFallback = ""] = (supplier.kontak ?? "-").includes("@")
    ? ["-", supplier.kontak]
    : [supplier.kontak ?? "-", ""];
  return {
    id: supplier.supplierId,
    name: supplier.nama,
    abbr: supplier.nama.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase(),
    logoColor: LOGO_COLORS[index % LOGO_COLORS.length],
    contactPerson: "PIC " + supplier.nama.split(" ")[0],
    email: emailFallback || `sales-${index + 1}@supplier.test`,
    phone: phoneOrEmail,
    city: "Jakarta",
    country: "Indonesia",
    totalPurchases,
    productCount: products.length,
    debt,
    lastOrder: "13 Jun 2026",
    joinDate: "01 Jun 2026",
    status: debt > 0 ? "Hutang" : "Lunas",
    recentTx: products.slice(0, 3).map((product) => ({
      name: product.nama,
      date: "13 Jun 2026",
      amount: product.harga * 10,
    })),
  };
}

export const mockSuppliers: Supplier[] = sourceSuppliers.map((supplier, index) => toSupplierView(supplier, index, mockProducts));

export function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatRpShort(n: number): string {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + " M";
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(0) + " Jt";
  if (n >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " Rb";
  return "Rp " + n;
}
