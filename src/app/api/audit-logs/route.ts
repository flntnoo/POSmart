import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canReadSystemLogs } from "@/lib/rbac-server";
import { createAuditLog, listAuditLogs } from "@/server/services/posmart";
import { auditCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canReadSystemLogs(user);
    return ok("Audit log berhasil diambil", await listAuditLogs(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canReadSystemLogs(user);
    return created("Audit log berhasil dibuat", await createAuditLog(user, auditCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
