import { belongsToWorkspaceOutlet, getLowStockNotificationKey, lowStockNotificationKeys, mockInventory } from "@/data/mockData";
import type { Inventory } from "@/types/posmart";
import { fail, ok } from "./api";

export const inventoryService = {
  async list(filters?: { outletId?: string; productId?: string; userId?: string }) {
    const inventory = mockInventory.filter((item) => {
      if (filters?.outletId && item.outletId !== filters.outletId) return false;
      if (filters?.productId && item.productId !== filters.productId) return false;
      if (filters?.userId && !belongsToWorkspaceOutlet(item.outletId, filters.userId)) return false;
      return true;
    });
    return ok("Daftar inventory berhasil diambil", inventory);
  },

  async create(input: { productId: string; outletId: string; stok: number; minStock?: number }) {
    if (!input.productId) return fail<Inventory>("Validasi gagal", { productId: "Produk wajib dipilih" });
    if (!input.outletId) return fail<Inventory>("Validasi gagal", { outletId: "Outlet wajib dipilih" });
    if (input.stok < 0) return fail<Inventory>("Validasi gagal", { stok: "Stok tidak boleh negatif" });
    const existing = mockInventory.find((item) => item.productId === input.productId && item.outletId === input.outletId);
    if (existing) return fail<Inventory>("Validasi gagal", { stok: "Inventory untuk produk dan outlet ini sudah ada" });
    const inventory: Inventory = {
      inventoryId: `inv-${Date.now()}`,
      productId: input.productId,
      outletId: input.outletId,
      stok: input.stok,
      minStock: input.minStock ?? 5,
      updatedAt: new Date().toISOString(),
    };
    mockInventory.unshift(inventory);
    if (inventory.stok > inventory.minStock) {
      lowStockNotificationKeys.delete(getLowStockNotificationKey("user-owner-001", inventory.productId, inventory.outletId));
    }
    return ok("Inventory awal berhasil dibuat", inventory);
  },

  async adjust(input: { productId: string; outletId: string; quantity: number; type: "in" | "out" | "set" }) {
    if (input.quantity < 0) return fail<Inventory>("Validasi gagal", { quantity: "Jumlah stok tidak boleh negatif" });
    const current = mockInventory.find((item) => item.productId === input.productId && item.outletId === input.outletId);
    if (!current) return fail<Inventory>("Inventory tidak ditemukan");
    const nextStock = input.type === "set" ? input.quantity : input.type === "in" ? current.stok + input.quantity : current.stok - input.quantity;
    if (nextStock < 0) return fail<Inventory>("Validasi gagal", { stok: "Stok tidak boleh negatif" });
    current.stok = nextStock;
    current.updatedAt = new Date().toISOString();
    if (current.stok > current.minStock) {
      for (const key of [...lowStockNotificationKeys]) {
        if (key.endsWith(`|${current.productId}|${current.outletId}`)) lowStockNotificationKeys.delete(key);
      }
    }
    return ok("Inventory berhasil disesuaikan", current);
  },
};
