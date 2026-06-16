import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canReadSystemLogs } from "@/lib/rbac-server";
import { getAuditLog } from "@/server/services/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canReadSystemLogs(user);
    const { id } = await context.params;
    return ok("Detail audit log berhasil diambil", await getAuditLog(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
