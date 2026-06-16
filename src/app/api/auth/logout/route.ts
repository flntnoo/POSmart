import { ok } from "@/lib/api-response";
import { sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = ok("Logout berhasil", null);
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
