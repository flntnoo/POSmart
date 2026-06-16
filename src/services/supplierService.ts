import { belongsToWorkspaceOutlet, getWorkspaceOwnerId, mockProducts, mockSupplierOwners, mockSuppliers } from "@/data/mockData";
import type { Supplier } from "@/types/posmart";
import { fail, ok } from "./api";

export const supplierService = {
  async list(filters?: { userId?: string }) {
    const ownerId = getWorkspaceOwnerId(filters?.userId);
    const supplierIdsFromProducts = new Set(
      mockProducts
        .filter((product) => !filters?.userId || belongsToWorkspaceOutlet(product.outletId, filters.userId))
        .map((product) => product.supplierId)
        .filter((supplierId): supplierId is string => Boolean(supplierId)),
    );
    const suppliers = ownerId
      ? mockSuppliers.filter((supplier) => mockSupplierOwners[supplier.supplierId] === ownerId || supplierIdsFromProducts.has(supplier.supplierId))
      : mockSuppliers;
    return ok("Daftar supplier berhasil diambil", suppliers);
  },

  async create(input: Pick<Supplier, "nama" | "kontak"> & { userId?: string }) {
    if (!input.nama) return fail<Supplier>("Validasi gagal", { nama: "Nama supplier wajib diisi" });
    const { userId, ...supplierInput } = input;
    const supplier = { supplierId: `supplier-${Date.now()}`, ...supplierInput };
    mockSuppliers.unshift(supplier);
    const ownerId = getWorkspaceOwnerId(userId);
    if (ownerId) mockSupplierOwners[supplier.supplierId] = ownerId;
    return ok("Supplier berhasil dibuat", supplier);
  },

  async update(supplierId: string, input: Partial<Pick<Supplier, "nama" | "kontak">>) {
    const supplier = mockSuppliers.find((item) => item.supplierId === supplierId);
    if (!supplier) return fail<Supplier>("Supplier tidak ditemukan");
    Object.assign(supplier, input);
    return ok("Supplier berhasil diperbarui", supplier);
  },

  async remove(supplierId: string) {
    return ok("Supplier siap dihapus pada backend", { supplierId });
  },
};
