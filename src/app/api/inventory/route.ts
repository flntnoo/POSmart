import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { createInventory, listInventory } from "@/server/services/posmart";
import { inventoryCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar inventory berhasil diambil", await listInventory(user, request.nextUrl.searchParams));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    return created("Inventory awal berhasil dibuat", await createInventory(user, inventoryCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
