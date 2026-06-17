import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canReadAnalytics } from "@/lib/rbac-server";
import { analyticsSummary } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canReadAnalytics(user);
    const summary = await analyticsSummary(user, request.nextUrl.searchParams);
    return ok("Produk terlaris berhasil diambil", summary.produkTerlaris);
  } catch (error) {
    return handleApiError(error);
  }
}
