import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { currentSubscription } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Subscription berhasil diambil", await currentSubscription(user));
  } catch (error) {
    return handleApiError(error);
  }
}
