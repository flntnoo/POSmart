import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { deleteOutlet, getOutlet, updateOutlet } from "@/server/services/posmart";
import { outletUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail outlet berhasil diambil", await getOutlet(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Outlet berhasil diperbarui", await updateOutlet(user, parseId(id), outletUpdateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Outlet berhasil dihapus", await deleteOutlet(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
