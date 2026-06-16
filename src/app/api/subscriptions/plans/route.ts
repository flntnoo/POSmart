import { handleApiError, ok } from "@/lib/api-response";
import { subscriptionPlans } from "@/server/services/posmart";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok("Daftar paket berhasil diambil", await subscriptionPlans());
  } catch (error) {
    return handleApiError(error);
  }
}
