import type { Category } from "@/types/posmart";
import { apiRequest, jsonBody } from "./api";

export const categoryService = {
  list(filters?: { userId?: string }) {
    void filters;
    return apiRequest<Category[]>("/api/categories");
  },

  detail(categoryId: string) {
    return apiRequest<Category>(`/api/categories/${categoryId}`);
  },

  create(input: Pick<Category, "nama"> & { userId?: string }) {
    return apiRequest<Category>("/api/categories", {
      method: "POST",
      body: jsonBody({ nama: input.nama }),
    });
  },

  update(categoryId: string, input: Pick<Category, "nama">) {
    return apiRequest<Category>(`/api/categories/${categoryId}`, {
      method: "PATCH",
      body: jsonBody(input),
    });
  },

  remove(categoryId: string) {
    return apiRequest<{ categoryId: string }>(`/api/categories/${categoryId}`, { method: "DELETE" });
  },
};
