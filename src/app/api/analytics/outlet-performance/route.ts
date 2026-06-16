import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { analyticsSummary } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Performa outlet berhasil diambil", await analyticsSummary(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}
