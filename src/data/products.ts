import { getProductStock, mockCategories, mockInventory, mockProducts } from "@/data/mockData";
import type { Category, Inventory, Product as DomainProduct } from "@/types/posmart";

export type ProductCategory = "Minuman" | "Makanan" | "Snack" | "Retail";
export type ProductStatus = "Aktif" | "Menipis" | "Habis";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  stock: number;
  minStock: number;
  price: number;
  sold: number;
};

const categoryNameById = new Map(mockCategories.map((category) => [category.categoryId, category.nama as ProductCategory]));

export function getStatus(stock: number, minStock: number): ProductStatus {
  if (stock === 0) return "Habis";
  if (stock <= minStock) return "Menipis";
  return "Aktif";
}

export function toProductView(product: DomainProduct, inventorySource: Inventory[] = mockInventory, categorySource: Category[] = mockCategories): Product {
  const categories = new Map(categorySource.map((category) => [category.categoryId, category.nama as ProductCategory]));
  const inventoryRows = inventorySource.filter((item) => item.productId === product.productId);
  return {
    id: product.productId,
    name: product.nama,
    sku: product.sku ?? product.productId,
    category: categories.get(product.categoryId ?? "") ?? categoryNameById.get(product.categoryId ?? "") ?? "Retail",
    stock: inventoryRows.reduce((sum, item) => sum + item.stok, 0),
    minStock: inventoryRows.length > 0 ? Math.min(...inventoryRows.map((item) => item.minStock)) : 5,
    price: product.harga,
    sold: 0,
  };
}

export const mockProductsLegacy: Product[] = mockProducts.map((product) => {
  const view = toProductView(product, mockInventory, mockCategories);
  return {
    ...view,
    stock: getProductStock(product.productId),
  };
});

export { mockProductsLegacy as mockProducts };

export const PRODUCT_CATEGORIES: ProductCategory[] = ["Minuman", "Makanan", "Snack", "Retail"];
