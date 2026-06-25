import type { Product } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

export const productService = {
  list(filters?: { outletId?: string; categoryId?: string; search?: string; userId?: string; page?: number; limit?: number }) {
    return apiListRequest<Product>(`/api/products${queryString(filters)}`);
  },

  detail(productId: string) {
    return apiRequest<Product>(`/api/products/${productId}`);
  },

  create(input: Omit<Product, "productId" | "createdAt" | "updatedAt">) {
    return apiRequest<Product>("/api/products", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  update(productId: string, input: Partial<Omit<Product, "productId" | "createdAt" | "updatedAt">>) {
    return apiRequest<Product>(`/api/products/${productId}`, {
      method: "PATCH",
      body: jsonBody(input),
    });
  },

  remove(productId: string) {
    return apiRequest<{ productId: string }>(`/api/products/${productId}`, { method: "DELETE" });
  },
};
