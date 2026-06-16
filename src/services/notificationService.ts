import { getLowStockNotificationKey, getWorkspaceUserIds, lowStockNotificationKeys, mockNotificationLogs } from "@/data/mockData";
import type { NotificationLog } from "@/types/posmart";
import { fail, ok } from "./api";

type LowStockInput = {
  userId: string;
  productId: string;
  outletId: string;
  productName: string;
  outletName: string;
  stock: number;
};

export const notificationService = {
  async list(filters?: string | { userId?: string; workspaceUserId?: string }) {
    const userId = typeof filters === "string" ? filters : filters?.userId;
    const workspaceUserIds = typeof filters === "object" ? getWorkspaceUserIds(filters.workspaceUserId) : undefined;
    const logs = mockNotificationLogs.filter((item) => {
      if (userId && item.userId !== userId) return false;
      if (workspaceUserIds && !workspaceUserIds.has(item.userId)) return false;
      return true;
    });
    return ok("Notification log berhasil diambil", logs);
  },

  async create(input: Omit<NotificationLog, "notifId" | "createdAt" | "status"> & { status?: NotificationLog["status"] }) {
    if (!input.pesan) return fail<NotificationLog>("Validasi gagal", { pesan: "Pesan notifikasi wajib diisi" });
    const { status, ...notificationInput } = input;
    const notification: NotificationLog = {
      notifId: `notif-${Date.now()}`,
      status: status ?? "sent",
      createdAt: new Date().toISOString(),
      ...notificationInput,
    };
    mockNotificationLogs.unshift(notification);
    return ok("Notification log berhasil dibuat", notification);
  },

  async createLowStock(input: LowStockInput) {
    const key = getLowStockNotificationKey(input.userId, input.productId, input.outletId);
    if (lowStockNotificationKeys.has(key)) {
      return ok<NotificationLog | null>("Notifikasi stok menipis sudah ada", null);
    }

    lowStockNotificationKeys.add(key);
    const notification: NotificationLog = {
      notifId: `notif-${Date.now()}`,
      userId: input.userId,
      tipe: "low_stock",
      pesan: `Stok ${input.productName} menipis di ${input.outletName}. Sisa ${input.stock} unit.`,
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    mockNotificationLogs.unshift(notification);
    return ok("Notification log berhasil dibuat", notification);
  },
};
