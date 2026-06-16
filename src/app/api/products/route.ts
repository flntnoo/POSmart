import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { createProduct, listProducts } from "@/server/services/posmart";
import { productCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar produk berhasil diambil", await listProducts(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    return created("Produk berhasil dibuat", await createProduct(user, productCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
