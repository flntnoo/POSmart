import { getWorkspaceUserIds, mockAuditLogs } from "@/data/mockData";
import type { AuditLog } from "@/types/posmart";
import { fail, ok } from "./api";

export const auditLogService = {
  async list(filters?: { userId?: string; module?: string; workspaceUserId?: string }) {
    const workspaceUserIds = getWorkspaceUserIds(filters?.workspaceUserId);
    const logs = mockAuditLogs.filter((item) => {
      if (filters?.userId && item.userId !== filters.userId) return false;
      if (workspaceUserIds && !workspaceUserIds.has(item.userId)) return false;
      if (filters?.module && item.module !== filters.module) return false;
      return true;
    });
    return ok("Audit log berhasil diambil", logs);
  },

  async create(input: Omit<AuditLog, "auditId" | "createdAt">) {
    if (!input.aksi) return fail<AuditLog>("Validasi gagal", { aksi: "Aksi audit wajib diisi" });
    const auditLog: AuditLog = {
      auditId: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    mockAuditLogs.unshift(auditLog);
    return ok("Audit log berhasil dibuat", auditLog);
  },
};
