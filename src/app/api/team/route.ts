import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { requireRole } from "@/lib/rbac-server";
import { inviteTeamMember, listTeamMembers } from "@/server/services/posmart";
import { teamInviteSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ["owner"]);
    return ok("Daftar karyawan berhasil diambil", await listTeamMembers(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ["owner"]);
    return created("Karyawan berhasil dibuat", await inviteTeamMember(user, teamInviteSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
