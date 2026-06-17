import type { Customer } from "@/types/posmart";
import { apiRequest, jsonBody } from "./api";

export const customerService = {
  list(filters?: { userId?: string }) {
    void filters;
    return apiRequest<Customer[]>("/api/customers");
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
