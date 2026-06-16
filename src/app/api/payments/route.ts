import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canManageSubscription, requireRole } from "@/lib/rbac-server";
import { createPayment, listPayments } from "@/server/services/posmart";
import { paymentCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ["owner", "admin"]);
    return ok("Riwayat pembayaran berhasil diambil", await listPayments(user, request.nextUrl.searchParams.get("subscriptionId") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canManageSubscription(user);
    return created("Payment record berhasil dibuat", await createPayment(user, paymentCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
