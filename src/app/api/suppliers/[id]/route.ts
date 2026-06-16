import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { deleteSupplier, getSupplier, updateSupplier } from "@/server/services/posmart";
import { supplierUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail supplier berhasil diambil", await getSupplier(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Supplier berhasil diperbarui", await updateSupplier(user, parseId(id), supplierUpdateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Supplier berhasil dihapus", await deleteSupplier(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
