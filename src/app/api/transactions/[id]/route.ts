import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { getTransaction } from "@/server/services/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail transaksi berhasil diambil", await getTransaction(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
