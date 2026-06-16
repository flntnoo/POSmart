"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { notificationService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { NotificationLog, NotificationStatus, NotificationType } from "@/types/posmart";
import { Bell, Search } from "lucide-react";

const typeLabels: Record<NotificationType, string> = {
  activation: "Aktivasi akun",
  low_stock: "Stok menipis",
  renewal: "Pengingat subscription",
  system: "Sistem",
};

const statusStyles: Record<NotificationStatus, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  sent: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-500",
};

export default function NotificationsPage() {
  const { currentUser } = useSession();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | NotificationStatus>("all");

  useEffect(() => {
    let mounted = true;
    notificationService.list({ workspaceUserId: currentUser?.userId }).then((response) => {
      if (!mounted) return;
      if (response.success && response.data) setLogs(response.data);
      else setError(response.message);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentUser?.userId]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    if (typeFilter !== "all" && log.tipe !== typeFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    return true;
  }), [logs, statusFilter, typeFilter]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notification Log</h1>
          <p className="mt-0.5 text-sm text-gray-500">Riwayat pesan sistem untuk aktivasi, stok, dan subscription</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input readOnly value={`${filteredLogs.length} notifikasi`} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-gray-500 outline-none" />
        </div>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | NotificationType)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none">
          <option value="all">Semua tipe</option>
          <option value="activation">Aktivasi akun</option>
          <option value="low_stock">Stok menipis</option>
          <option value="renewal">Pengingat subscription</option>
          <option value="system">Sistem</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | NotificationStatus)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none">
          <option value="all">Semua status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState title="Gagal memuat notifikasi" description={error} /> : (
        <div className="overflow-x-auto rounded-[20px] bg-white shadow-sm">
          {filteredLogs.length === 0 ? (
            <EmptyState title="Belum ada notifikasi" description="Riwayat notifikasi akan muncul setelah sistem membuat pesan." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipe</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pesan</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.notifId} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Bell size={18} /></div>
                        <span className="font-semibold text-gray-800">{typeLabels[log.tipe]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{log.pesan}</td>
                    <td className="px-4 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyles[log.status]}`}>{log.status}</span></td>
                    <td className="px-4 py-4 text-gray-500">{new Date(log.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
