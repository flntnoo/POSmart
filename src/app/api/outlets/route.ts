import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { createOutlet, listOutlets } from "@/server/services/posmart";
import { outletCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Daftar outlet berhasil diambil", await listOutlets(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const input = outletCreateSchema.parse(await request.json());
    return created("Outlet berhasil dibuat", await createOutlet(user, input));
  } catch (error) {
    return handleApiError(error);
  }
}
