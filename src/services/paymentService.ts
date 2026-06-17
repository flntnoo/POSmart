import type { Payment } from "@/types/posmart";
import { apiRequest, jsonBody, queryString } from "./api";

export const paymentService = {
  list(subscriptionId?: string) {
    return apiRequest<Payment[]>(`/api/payments${queryString({ subscriptionId })}`);
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
