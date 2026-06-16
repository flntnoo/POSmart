import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userDto } from "@/server/dto/posmart";
import { updateProfile } from "@/server/services/posmart";
import { profileUpdateSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { userId: session.userId } });
    return ok("Profil berhasil diambil", userDto(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const input = profileUpdateSchema.parse(await request.json());
    return ok("Profil berhasil diperbarui", await updateProfile(session, input));
  } catch (error) {
    return handleApiError(error);
  }
}
