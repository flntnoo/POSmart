import type { Payment } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

export const paymentService = {
  list(subscriptionId?: string, filters?: { page?: number; limit?: number }) {
    return apiListRequest<Payment>(`/api/payments${queryString({ subscriptionId, ...filters })}`);
  },

  create(input: Pick<Payment, "subscriptionId" | "jumlah" | "metode"> & { status?: Payment["status"] }) {
    return apiRequest<Payment>("/api/payments", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  updateStatus(paymentId: string, status: Payment["status"]) {
    return apiRequest<Payment>(`/api/payments/${paymentId}/status`, {
      method: "PATCH",
      body: jsonBody({ status }),
    });
  },
};
