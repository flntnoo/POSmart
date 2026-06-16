import { getProductStock, mockCategories, mockProducts } from "@/data/mockData";

export type ProductCategory = "Minuman" | "Makanan" | "Snack" | "Retail";

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: ProductCategory;
  variants?: string[];
};

const categoryNameById = new Map(mockCategories.map((category) => [category.categoryId, category.nama as ProductCategory]));

export const posProducts: Product[] = mockProducts.map((product) => ({
  id: product.productId,
  name: product.nama,
  sku: product.sku ?? product.productId,
  price: product.harga,
  category: categoryNameById.get(product.categoryId ?? "") ?? "Retail",
  variants: product.productId === "prod-kopi-susu" || product.productId === "prod-americano" ? ["Hot", "Ice"] : undefined,
}));

export const categoryConfig: Record<
  ProductCategory,
  { gradientFrom: string; gradientTo: string; abbr: string }
> = {
  Minuman: { gradientFrom: "#FFF3E0", gradientTo: "#FFE0B2", abbr: "MN" },
  Makanan: { gradientFrom: "#E3F2FD", gradientTo: "#BBDEFB", abbr: "MK" },
  Snack: { gradientFrom: "#E8F5E9", gradientTo: "#C8E6C9", abbr: "SN" },
  Retail: { gradientFrom: "#F3E5F5", gradientTo: "#E1BEE7", abbr: "RT" },
};

export function getPosStock(productId: string) {
  return getProductStock(productId);
}
