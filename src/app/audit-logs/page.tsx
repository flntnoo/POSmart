"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { auditLogService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { AuditLog } from "@/types/posmart";
import { ClipboardList } from "lucide-react";

export default function AuditLogsPage() {
  const { currentUser } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    auditLogService.list({ workspaceUserId: currentUser?.userId }).then((response) => {
      if (!mounted) return;
      if (response.success && response.data) setLogs(response.data);
      else setError(response.message);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentUser?.userId]);

  const modules = useMemo(() => [...new Set(logs.map((log) => log.module))], [logs]);
  const users = useMemo(() => [...new Set(logs.map((log) => log.userId))], [logs]);
  const filteredLogs = useMemo(() => logs.filter((log) => {
    if (userFilter !== "all" && log.userId !== userFilter) return false;
    if (moduleFilter !== "all" && log.module !== moduleFilter) return false;
    return true;
  }), [logs, moduleFilter, userFilter]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-gray-500">Riwayat aktivitas penting pengguna</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none">
          <option value="all">Semua user</option>
          {users.map((userId) => <option key={userId} value={userId}>{userId === currentUser?.userId ? currentUser.nama : `User ${userId}`}</option>)}
        </select>
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none">
          <option value="all">Semua modul</option>
          {modules.map((moduleName) => <option key={moduleName} value={moduleName}>{moduleName}</option>)}
        </select>
        <span className="ml-auto rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">{filteredLogs.length} aktivitas</span>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState title="Gagal memuat audit log" description={error} /> : (
        <div className="overflow-x-auto rounded-[20px] bg-white shadow-sm">
          {filteredLogs.length === 0 ? (
            <EmptyState title="Belum ada audit log" description="Aktivitas penting akan tercatat di halaman ini." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">User</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Aksi</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Modul</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.auditId} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><ClipboardList size={18} /></div>
                        <div>
                          <p className="font-semibold text-gray-800">{log.userId === currentUser?.userId ? currentUser.nama : `User ${log.userId}`}</p>
                          <p className="text-xs text-gray-400">{log.userId === currentUser?.userId ? currentUser.role : "workspace user"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{log.aksi}</td>
                    <td className="px-4 py-4"><span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{log.module}</span></td>
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
