import type { AuditLog } from "@/types/posmart";
import { apiRequest, jsonBody, queryString } from "./api";

export const auditLogService = {
  list(filters?: { userId?: string; module?: string; workspaceUserId?: string }) {
    return apiRequest<AuditLog[]>(`/api/audit-logs${queryString({ module: filters?.module })}`);
  },

  create(input: Omit<AuditLog, "auditId" | "createdAt">) {
    return apiRequest<AuditLog>("/api/audit-logs", {
      method: "POST",
      body: jsonBody({ aksi: input.aksi, module: input.module }),
    });
  },
};
