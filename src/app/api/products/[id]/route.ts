import { NextRequest } from "next/server";
import { handleApiError, ok, parseId } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { deleteProduct, getProduct, updateProduct } from "@/server/services/posmart";
import { productUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    return ok("Detail produk berhasil diambil", await getProduct(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Produk berhasil diperbarui", await updateProduct(user, parseId(id), productUpdateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const { id } = await context.params;
    return ok("Produk berhasil dihapus", await deleteProduct(user, parseId(id)));
  } catch (error) {
    return handleApiError(error);
  }
}
