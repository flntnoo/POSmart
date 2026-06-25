import type { NotificationLog } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

type LowStockInput = {
  userId: string;
  productId: string;
  outletId: string;
  productName: string;
  outletName: string;
  stock: number;
};

export const notificationService = {
  list(filters?: string | { userId?: string; workspaceUserId?: string; page?: number; limit?: number }) {
    const query = typeof filters === "string" ? { userId: filters } : filters;
    return apiListRequest<NotificationLog>(`/api/notifications${queryString(query)}`);
  },

  create(input: Omit<NotificationLog, "notifId" | "createdAt" | "status"> & { status?: NotificationLog["status"] }) {
    return apiRequest<NotificationLog>("/api/notifications", {
      method: "POST",
      body: jsonBody({ pesan: input.pesan, tipe: input.tipe, status: input.status }),
    });
  },

  createLowStock(input: LowStockInput) {
    return apiRequest<NotificationLog>("/api/notifications", {
      method: "POST",
      body: jsonBody({
        tipe: "low_stock",
        status: "sent",
        pesan: `Stok ${input.productName} menipis di ${input.outletName}. Sisa ${input.stock} unit.`,
      }),
    });
  },
};
