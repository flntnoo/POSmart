import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { createSupplier, listSuppliers } from "@/server/services/posmart";
import { supplierCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar supplier berhasil diambil", await listSuppliers(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    return created("Supplier berhasil dibuat", await createSupplier(user, supplierCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
