import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canReadAnalytics } from "@/lib/rbac-server";
import { analyticsOutletPerformance } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canReadAnalytics(user);
    return ok("Performa outlet berhasil diambil", await analyticsOutletPerformance(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}
