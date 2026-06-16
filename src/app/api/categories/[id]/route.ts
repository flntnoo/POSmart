import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { deleteCategory, getCategory, updateCategory } from "@/server/services/posmart";
import { categoryUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail kategori berhasil diambil", await getCategory(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Kategori berhasil diperbarui", await updateCategory(user, parseId(id), categoryUpdateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Kategori berhasil dihapus", await deleteCategory(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
