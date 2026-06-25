import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/posmart";

type PrismaLikeError = Error & {
  code?: string;
  meta?: {
    target?: unknown;
    cause?: unknown;
  };
};

function isPrismaKnownError(error: unknown): error is PrismaLikeError {
  return (
    error instanceof Error &&
    typeof (error as PrismaLikeError).code === "string" &&
    /^P\d{4}$/.test((error as PrismaLikeError).code ?? "")
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function ok<T>(message: string, data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json<ApiResponse<never>>({ success: false, message, errors }, { status });
}

export function created<T>(message: string, data: T) {
  return ok(message, data, 201);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status, error.errors);
  }

  if (error instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "request";
      errors[key] = issue.message;
    }
    return fail("Validasi gagal", 400, errors);
  }

  if (isPrismaKnownError(error)) {
    switch (error.code) {
      case "P2002":
        return fail("Data sudah digunakan.", 409);

      case "P2003":
        return fail("Data terkait tidak valid atau tidak ditemukan.", 400);

      case "P2025":
        return fail("Data tidak ditemukan.", 404);

      default:
        console.error("Prisma error:", error);
        return fail("Terjadi kesalahan database.", 500);
    }
  }

  console.error(error);
  return fail("Terjadi kesalahan server", 500);
}

export function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "ID tidak valid", { id: "ID harus berupa angka positif" });
  }
  return id;
}
