import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { loginUser } from "@/server/services/posmart";
import { loginSchema } from "@/server/validators/posmart";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const { user, sessionUser } = await loginUser(input);
    const response = ok("Login berhasil", user);
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
