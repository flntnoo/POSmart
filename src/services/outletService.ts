import type { Outlet } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

type OutletInput = Omit<Outlet, "outletId" | "userId" | "createdAt" | "updatedAt">;

export const outletService = {
  list(filters?: { userId?: string; page?: number; limit?: number }) {
    return apiListRequest<Outlet>(`/api/outlets${queryString(filters)}`);
  },

  detail(outletId: string) {
    return apiRequest<Outlet>(`/api/outlets/${outletId}`);
  },

  create(input: Partial<OutletInput> & Pick<Outlet, "nama"> & { userId?: string }) {
    return apiRequest<Outlet>("/api/outlets", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  update(outletId: string, input: Partial<OutletInput>) {
    return apiRequest<Outlet>(`/api/outlets/${outletId}`, {
      method: "PATCH",
      body: jsonBody(input),
    });
  },

  remove(outletId: string) {
    return apiRequest<{ outletId: string }>(`/api/outlets/${outletId}`, { method: "DELETE" });
  },
};
