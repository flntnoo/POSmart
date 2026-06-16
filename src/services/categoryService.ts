import { belongsToWorkspaceOutlet, getWorkspaceOwnerId, mockCategories, mockCategoryOwners, mockProducts } from "@/data/mockData";
import type { Category } from "@/types/posmart";
import { fail, ok } from "./api";

export const categoryService = {
  async list(filters?: { userId?: string }) {
    const ownerId = getWorkspaceOwnerId(filters?.userId);
    const categoryIdsFromProducts = new Set(
      mockProducts
        .filter((product) => !filters?.userId || belongsToWorkspaceOutlet(product.outletId, filters.userId))
        .map((product) => product.categoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    );
    const categories = ownerId
      ? mockCategories.filter((category) => mockCategoryOwners[category.categoryId] === ownerId || categoryIdsFromProducts.has(category.categoryId))
      : mockCategories;
    return ok("Daftar kategori berhasil diambil", categories);
  },

  async create(input: Pick<Category, "nama"> & { userId?: string }) {
    if (!input.nama) return fail<Category>("Validasi gagal", { nama: "Nama kategori wajib diisi" });
    const category = { categoryId: `cat-${Date.now()}`, nama: input.nama };
    mockCategories.unshift(category);
    const ownerId = getWorkspaceOwnerId(input.userId);
    if (ownerId) mockCategoryOwners[category.categoryId] = ownerId;
    return ok("Kategori berhasil dibuat", category);
  },

  async update(categoryId: string, input: Pick<Category, "nama">) {
    const category = mockCategories.find((item) => item.categoryId === categoryId);
    if (!category) return fail<Category>("Kategori tidak ditemukan");
    Object.assign(category, input);
    return ok("Kategori berhasil diperbarui", category);
  },

  async remove(categoryId: string) {
    return ok("Kategori siap dihapus pada backend", { categoryId });
  },
};
