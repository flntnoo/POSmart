import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canWriteOperationalData } from "@/lib/rbac-server";
import { adjustInventory } from "@/server/services/posmart";
import { inventoryAdjustSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    canWriteOperationalData(user);
    const input = inventoryAdjustSchema.parse(await request.json());
    return ok("Inventory berhasil disesuaikan", await adjustInventory(user, input));
  } catch (error) {
    return handleApiError(error);
  }
}
