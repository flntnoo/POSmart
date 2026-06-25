import type {
  Category,
  Inventory,
  Outlet,
  Product as DomainProduct,
  Supplier,
} from "@/types/posmart";

export type KnownProductCategory = "Minuman" | "Makanan" | "Snack" | "Retail";
export type ProductCategory = KnownProductCategory | "Belum tersedia";
export type ProductStatus = "Aktif" | "Menipis" | "Habis" | "Belum tersedia";
export const PRODUCT_CATEGORIES: KnownProductCategory[] = ["Minuman", "Makanan", "Snack", "Retail"];

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  supplier: string;
  outlet: string;
  stock: number | null;
  minStock: number | null;
  price: number;
};

type ProductSources = {
  inventory: Inventory[];
  categories: Category[];
  suppliers: Supplier[];
  outlets: Outlet[];
};

function normalizeCategory(value: string | undefined): ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as KnownProductCategory)
    ? value as KnownProductCategory
    : "Belum tersedia";
}

export function getStatus(stock: number | null, minStock: number | null): ProductStatus {
  if (stock === null || minStock === null) return "Belum tersedia";
  if (stock === 0) return "Habis";
  if (stock <= minStock) return "Menipis";
  return "Aktif";
}

export function toProductView(product: DomainProduct, sources: ProductSources): Product {
  const inventoryRows = sources.inventory.filter((item) => item.productId === product.productId);
  const category = sources.categories.find((item) => item.categoryId === product.categoryId);
  const supplier = sources.suppliers.find((item) => item.supplierId === product.supplierId);
  const outlet = sources.outlets.find((item) => item.outletId === product.outletId);

  return {
    id: product.productId,
    name: product.nama,
    sku: product.sku ?? "-",
    category: normalizeCategory(category?.nama),
    supplier: supplier?.nama ?? "Belum tersedia",
    outlet: outlet?.nama ?? "Belum tersedia",
    stock: inventoryRows.length > 0
      ? inventoryRows.reduce((sum, item) => sum + item.stok, 0)
      : null,
    minStock: inventoryRows.length > 0
      ? Math.min(...inventoryRows.map((item) => item.minStock))
      : null,
    price: product.harga,
  };
}
