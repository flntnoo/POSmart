import type { ApiResponse } from "@/types/posmart";

type QueryValue = string | number | boolean | undefined | null;

export function ok<T>(message: string, data: T): Promise<ApiResponse<T>> {
  return Promise.resolve({ success: true, message, data });
}

export function fail<T>(message: string, errors?: Record<string, string>): Promise<ApiResponse<T>> {
  return Promise.resolve({ success: false, message, errors });
}

export function queryString(filters?: Record<string, QueryValue>) {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    const payload = await response.json().catch(() => null) as ApiResponse<T> | null;
    if (payload && typeof payload.success === "boolean") return payload;

    return {
      success: false,
      message: response.ok ? "Response backend tidak valid" : `Request gagal (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: "Tidak dapat terhubung ke backend",
    };
  }
}

export function jsonBody(input: unknown) {
  return JSON.stringify(input);
}
