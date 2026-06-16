import { getWorkspaceOwnerId, mockOutlets } from "@/data/mockData";
import type { Outlet } from "@/types/posmart";
import { fail, ok } from "./api";

export const outletService = {
  async list(filters?: { userId?: string }) {
    const ownerId = getWorkspaceOwnerId(filters?.userId);
    const outlets = ownerId ? mockOutlets.filter((outlet) => outlet.userId === ownerId) : mockOutlets;
    return ok("Daftar outlet berhasil diambil", outlets);
  },

  async detail(outletId: string) {
    const outlet = mockOutlets.find((item) => item.outletId === outletId);
    return outlet ? ok("Detail outlet berhasil diambil", outlet) : fail<Outlet>("Outlet tidak ditemukan");
  },

  async create(input: Pick<Outlet, "nama" | "alamat" | "userId">) {
    if (!input.nama) return fail<Outlet>("Validasi gagal", { nama: "Nama outlet wajib diisi" });
    const now = new Date().toISOString();
    const outlet: Outlet = {
      outletId: `outlet-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    mockOutlets.unshift(outlet);
    return ok("Outlet berhasil dibuat", outlet);
  },

  async update(outletId: string, input: Partial<Pick<Outlet, "nama" | "alamat">>) {
    const outlet = mockOutlets.find((item) => item.outletId === outletId);
    if (!outlet) return fail<Outlet>("Outlet tidak ditemukan");
    Object.assign(outlet, input, { updatedAt: new Date().toISOString() });
    return ok("Outlet berhasil diperbarui", outlet);
  },

  async remove(outletId: string) {
    return ok("Outlet siap dihapus pada backend", { outletId });
  },
};
