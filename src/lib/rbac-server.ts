import { ApiError } from "@/lib/api-response";
import type { SessionUser } from "@/lib/auth";
import type { UserRole } from "@/types/posmart";

export function requireRole(user: SessionUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "Akses ditolak");
  }
}

export function canWriteOperationalData(user: SessionUser) {
  requireRole(user, ["owner", "admin"]);
}

export function canManageSubscription(user: SessionUser) {
  requireRole(user, ["owner"]);
}

export function canReadSystemLogs(user: SessionUser) {
  requireRole(user, ["owner", "admin"]);
}
