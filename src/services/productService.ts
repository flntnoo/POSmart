import { belongsToWorkspaceOutlet, mockInventory, mockProducts, mockTransactionDetails } from "@/data/mockData";
import type { Product } from "@/types/posmart";
import { fail, ok } from "./api";

export const productService = {
  async list(filters?: { outletId?: string; categoryId?: string; search?: string; userId?: string }) {
    const q = filters?.search?.toLowerCase();
    const products = mockProducts.filter((product) => {
      if (filters?.outletId && product.outletId !== filters.outletId) return false;
      if (filters?.userId && !belongsToWorkspaceOutlet(product.outletId, filters.userId)) return false;
      if (filters?.categoryId && product.categoryId !== filters.categoryId) return false;
      if (q && !product.nama.toLowerCase().includes(q) && !product.sku?.toLowerCase().includes(q)) return false;
      return true;
    });
    return ok("Daftar produk berhasil diambil", products);
  },

  async detail(productId: string) {
    const product = mockProducts.find((item) => item.productId === productId);
    return product ? ok("Detail produk berhasil diambil", product) : fail<Product>("Produk tidak ditemukan");
  },

  async create(input: Omit<Product, "productId" | "createdAt" | "updatedAt">) {
    if (!input.nama) return fail<Product>("Validasi gagal", { nama: "Nama produk wajib diisi" });
    if (input.harga < 0) return fail<Product>("Validasi gagal", { harga: "Harga tidak boleh negatif" });
    const now = new Date().toISOString();
    const product = { productId: `prod-${Date.now()}`, createdAt: now, updatedAt: now, ...input };
    mockProducts.unshift(product);
    return ok("Produk berhasil dibuat", product);
  },

  async update(productId: string, input: Partial<Omit<Product, "productId" | "createdAt" | "updatedAt">>) {
    const product = mockProducts.find((item) => item.productId === productId);
    if (!product) return fail<Product>("Produk tidak ditemukan");
    if (input.harga !== undefined && input.harga < 0) return fail<Product>("Validasi gagal", { harga: "Harga tidak boleh negatif" });
    Object.assign(product, input, { updatedAt: new Date().toISOString() });
    return ok("Produk berhasil diperbarui", product);
  },

  async remove(productId: string) {
    if (mockTransactionDetails.some((detail) => detail.productId === productId)) {
      return fail<{ productId: string }>("Produk masih terhubung dengan transaksi");
    }
    const index = mockProducts.findIndex((item) => item.productId === productId);
    if (index >= 0) mockProducts.splice(index, 1);
    for (let i = mockInventory.length - 1; i >= 0; i -= 1) {
      if (mockInventory[i].productId === productId) mockInventory.splice(i, 1);
    }
    return ok("Produk siap dihapus pada backend", { productId });
  },
};
