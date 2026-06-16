"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";
import { canAccessPath } from "@/lib/rbac";
import { ForbiddenState, LoadingState } from "@/components/ui/AppState";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentRole, isAuthenticated, loading } = useSession();

  if (loading) {
    return <LoadingState title="Memeriksa session..." description="Mohon tunggu sebentar." />;
  }

  if (!isAuthenticated || !currentRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6FA] p-6">
        <div className="max-w-sm rounded-[20px] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Login diperlukan</h1>
          <p className="mt-2 text-sm text-gray-500">Silakan masuk untuk mengakses area dashboard POSmart.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white">
            Ke Login
          </Link>
        </div>
      </div>
    );
  }

  if (!canAccessPath(currentRole, pathname)) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] p-8">
        <ForbiddenState actionHref="/dashboard" actionLabel="Kembali ke Dashboard" />
      </div>
    );
  }

  return <>{children}</>;
}
