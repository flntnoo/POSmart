import type { AuditLog } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody, queryString } from "./api";

export const auditLogService = {
  list(filters?: { userId?: string; module?: string; workspaceUserId?: string; page?: number; limit?: number }) {
    return apiListRequest<AuditLog>(`/api/audit-logs${queryString({ module: filters?.module, page: filters?.page, limit: filters?.limit })}`);
  },

  create(input: Omit<AuditLog, "auditId" | "createdAt">) {
    return apiRequest<AuditLog>("/api/audit-logs", {
      method: "POST",
      body: jsonBody({ aksi: input.aksi, module: input.module }),
    });
  },
};
