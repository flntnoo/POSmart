import type { ApiResponse } from "@/types/posmart";

export function ok<T>(message: string, data: T): Promise<ApiResponse<T>> {
  return Promise.resolve({ success: true, message, data });
}

export function fail<T>(message: string, errors?: Record<string, string>): Promise<ApiResponse<T>> {
  return Promise.resolve({ success: false, message, errors });
}
