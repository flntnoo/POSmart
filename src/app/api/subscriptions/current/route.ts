import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canReadSubscription } from "@/lib/rbac-server";
import { currentSubscription } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canReadSubscription(user);
    return ok("Subscription berhasil diambil", await currentSubscription(user));
  } catch (error) {
    return handleApiError(error);
  }
}
