import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canCreateTransaction } from "@/lib/rbac-server";
import { createTransaction, listTransactions } from "@/server/services/posmart";
import { transactionCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar transaksi berhasil diambil", await listTransactions(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canCreateTransaction(user);
    return created("Transaksi berhasil dibuat", await createTransaction(user, transactionCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
