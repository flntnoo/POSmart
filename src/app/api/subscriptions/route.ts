import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canManageSubscription } from "@/lib/rbac-server";
import { createSubscription, listSubscriptions } from "@/server/services/posmart";
import { subscriptionCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar subscription berhasil diambil", await listSubscriptions(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canManageSubscription(user);
    return created("Paket subscription berhasil dipilih", await createSubscription(user, subscriptionCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
