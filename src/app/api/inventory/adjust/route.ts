import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { adjustInventory } from "@/server/services/posmart";
import { inventoryAdjustSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    return ok("Inventory berhasil disesuaikan", await adjustInventory(user, inventoryAdjustSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
