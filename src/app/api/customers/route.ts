import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { createCustomer, listCustomers } from "@/server/services/posmart";
import { customerCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar pelanggan berhasil diambil", await listCustomers(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return created("Pelanggan berhasil dibuat", await createCustomer(user, customerCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
