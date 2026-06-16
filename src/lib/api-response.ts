import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/posmart";

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
