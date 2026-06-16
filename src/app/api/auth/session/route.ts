import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userDto } from "@/server/dto/posmart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { userId: session.userId } });
    return ok("Session aktif", userDto(user));
  } catch (error) {
    return handleApiError(error);
  }
}
