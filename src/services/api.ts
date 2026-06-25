import type { ApiResponse } from "@/types/posmart";

type QueryValue = string | number | boolean | undefined | null;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedList<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type ListApiResponse<T> = ApiResponse<T[]> & {
  pagination?: PaginationMeta;
};

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

function statusMessage(status: number) {
  const messages: Record<number, string> = {
    400: "Data yang dikirim belum valid",
    401: "Sesi Anda sudah berakhir. Silakan login kembali.",
    403: "Akses ditolak untuk role akun ini",
    404: "Data tidak ditemukan",
    409: "Data tidak dapat diproses karena konflik",
    422: "Validasi gagal",
    500: "Terjadi kesalahan server",
  };
  return messages[status] ?? `Request gagal (${status})`;
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
    if (payload && typeof payload.success === "boolean") {
      if (!payload.success && !payload.message) {
        return { ...payload, message: statusMessage(response.status) };
      }
      return payload;
    }

    return {
      success: false,
      message: response.ok ? "Response backend tidak valid" : statusMessage(response.status),
    };
  } catch {
    return {
      success: false,
      message: "Tidak dapat terhubung ke backend",
    };
  }
}

function isPaginatedList<T>(value: unknown): value is PaginatedList<T> {
  return Boolean(
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown }).items) &&
    typeof (value as { pagination?: unknown }).pagination === "object",
  );
}

export async function apiListRequest<T>(path: string, init?: RequestInit): Promise<ListApiResponse<T>> {
  const response = await apiRequest<T[] | PaginatedList<T>>(path, init);
  if (!response.success) return response as ListApiResponse<T>;

  if (Array.isArray(response.data)) {
    return { ...response, data: response.data };
  }

  if (isPaginatedList<T>(response.data)) {
    return { ...response, data: response.data.items, pagination: response.data.pagination };
  }

  return {
    success: false,
    message: "Response daftar data dari backend tidak valid",
  };
}

export function jsonBody(input: unknown) {
  return JSON.stringify(input);
}
