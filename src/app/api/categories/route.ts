import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { createCategory, listCategories } from "@/server/services/posmart";
import { categoryCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar kategori berhasil diambil", await listCategories(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    return created("Kategori berhasil dibuat", await createCategory(user, categoryCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
