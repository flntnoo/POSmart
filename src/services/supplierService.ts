import type { Supplier } from "@/types/posmart";
import { apiRequest, jsonBody } from "./api";

export const supplierService = {
  list(filters?: { userId?: string }) {
    void filters;
    return apiRequest<Supplier[]>("/api/suppliers");
  },

  detail(supplierId: string) {
    return apiRequest<Supplier>(`/api/suppliers/${supplierId}`);
  },

  create(input: Pick<Supplier, "nama" | "kontak"> & { userId?: string }) {
    return apiRequest<Supplier>("/api/suppliers", {
      method: "POST",
      body: jsonBody({ nama: input.nama, kontak: input.kontak }),
    });
  },

  update(supplierId: string, input: Partial<Pick<Supplier, "nama" | "kontak">>) {
    return apiRequest<Supplier>(`/api/suppliers/${supplierId}`, {
      method: "PATCH",
      body: jsonBody(input),
    });
  },

  remove(supplierId: string) {
    return apiRequest<{ supplierId: string }>(`/api/suppliers/${supplierId}`, { method: "DELETE" });
  },
};
