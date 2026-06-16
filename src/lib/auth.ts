import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api-response";
import type { UserRole } from "@/types/posmart";

export const sessionCookieName = "posmart_session";

export type SessionUser = {
  userId: number;
  ownerUserId: number;
  nama: string;
  email: string;
  role: UserRole;
};

type SessionPayload = SessionUser & {
  exp: number;
};

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new ApiError(500, "AUTH_SECRET belum dikonfigurasi");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

export async function requireAuth(request: NextRequest): Promise<SessionUser> {
  const token = request.cookies.get(sessionCookieName)?.value;
  const payload = verifySessionToken(token);
  if (!payload) {
    throw new ApiError(401, "Session tidak valid atau sudah berakhir");
  }

  const user = await prisma.user.findUnique({ where: { userId: payload.userId } });
  if (!user) {
    throw new ApiError(401, "User tidak ditemukan");
  }

  return {
    userId: user.userId,
    ownerUserId: user.ownerUserId ?? user.userId,
    nama: user.nama,
    email: user.email,
    role: user.role,
  };
}

export function toSessionUser(user: {
  userId: number;
  ownerUserId: number | null;
  nama: string;
  email: string;
  role: UserRole;
}): SessionUser {
  return {
    userId: user.userId,
    ownerUserId: user.ownerUserId ?? user.userId,
    nama: user.nama,
    email: user.email,
    role: user.role,
  };
}
