import type { Product, Supplier as DomainSupplier } from "@/types/posmart";

export type Supplier = {
  id: string;
  name: string;
  abbr: string;
  logoColor: string;
  contact: string;
  productCount: number;
};

const LOGO_COLORS = ["#FF6B00", "#374151", "#1D4ED8", "#059669", "#7C3AED"];

export function toSupplierView(supplier: DomainSupplier, index: number, productsSource: Product[]): Supplier {
  return {
    id: supplier.supplierId,
    name: supplier.nama,
    abbr: supplier.nama.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase(),
    logoColor: LOGO_COLORS[index % LOGO_COLORS.length],
    contact: supplier.kontak ?? "-",
    productCount: productsSource.filter((product) => product.supplierId === supplier.supplierId).length,
  };
}
