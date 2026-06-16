import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { deleteCustomer, getCustomer, updateCustomer } from "@/server/services/posmart";
import { customerUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail pelanggan berhasil diambil", await getCustomer(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Pelanggan berhasil diperbarui", await updateCustomer(user, parseId(id), customerUpdateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Pelanggan berhasil dihapus", await deleteCustomer(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
