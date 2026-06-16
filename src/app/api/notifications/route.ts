import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { requireRole } from "@/lib/rbac-server";
import { createNotification, listNotifications } from "@/server/services/posmart";
import { notificationCreateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok("Notification log berhasil diambil", await listNotifications(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ["owner", "admin"]);
    return created("Notification log berhasil dibuat", await createNotification(user, notificationCreateSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
