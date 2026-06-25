import type { Inventory } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

export const inventoryService = {
  list(filters?: { outletId?: string; productId?: string; userId?: string; status?: "low_stock"; page?: number; limit?: number }) {
    return apiListRequest<Inventory>(`/api/inventory${queryString(filters)}`);
  },

  create(input: { productId: string; outletId: string; stok: number; minStock?: number }) {
    return apiRequest<Inventory>("/api/inventory", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  adjust(input: { productId: string; outletId: string; quantity: number; type: "in" | "out" | "set" }) {
    return apiRequest<Inventory>("/api/inventory/adjust", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  lowStock() {
    return apiListRequest<Inventory>("/api/inventory/low-stock");
  },
};
