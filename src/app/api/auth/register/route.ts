import { NextRequest } from "next/server";
import { created, handleApiError } from "@/lib/api-response";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { registerUser } from "@/server/services/posmart";
import { registerSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());
    const { user, sessionUser } = await registerUser(input);
    const response = created("Registrasi berhasil", user);
    response.cookies.set(sessionCookieName, createSessionToken(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
