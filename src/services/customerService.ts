import type { Customer } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

export const customerService = {
  list(filters?: { userId?: string; page?: number; limit?: number; search?: string }) {
    return apiListRequest<Customer>(`/api/customers${queryString(filters)}`);
  },

  detail(customerId: string) {
    return apiRequest<Customer>(`/api/customers/${customerId}`);
  },

  create(input: Omit<Customer, "customerId"> & { userId?: string }) {
    return apiRequest<Customer>("/api/customers", {
      method: "POST",
      body: jsonBody({ nama: input.nama, email: input.email, telepon: input.telepon }),
    });
  },

  update(customerId: string, input: Partial<Omit<Customer, "customerId">>) {
    return apiRequest<Customer>(`/api/customers/${customerId}`, {
      method: "PATCH",
      body: jsonBody(input),
    });
  },

  remove(customerId: string) {
    return apiRequest<{ customerId: string }>(`/api/customers/${customerId}`, { method: "DELETE" });
  },
};
