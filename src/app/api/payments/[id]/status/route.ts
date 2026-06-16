import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canManageSubscription } from "@/lib/rbac-server";
import { updatePaymentStatus } from "@/server/services/posmart";
import { paymentStatusSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canManageSubscription(user);
    const { id } = await context.params;
    const { status } = paymentStatusSchema.parse(await request.json());
    return ok("Status payment berhasil diperbarui", await updatePaymentStatus(user, parseId(id), status));
  } catch (error) {
    return handleApiError(error);
  }
}
