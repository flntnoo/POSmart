"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useSession } from "@/contexts/SessionContext";
import { authService } from "@/services";
import { AlertTriangle, Calendar, CheckCircle2, ChevronRight, Loader2, LogOut, Mail, Save, ShieldCheck, UserRound } from "lucide-react";

const roleLabels = {
  owner: "Pemilik Toko",
  admin: "Admin",
  kasir: "Kasir",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function joinedDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const { currentUser, loading: sessionLoading, logout, setSessionUser } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (sessionLoading) return;
    let mounted = true;
    authService.profile().then((response) => {
      if (!mounted) return;
      if (response.success && response.data) {
        setName(response.data.nama);
        setEmail(response.data.email);
        setSessionUser(response.data);
      } else {
        setError(response.message);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [sessionLoading, setSessionUser]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Nama dan email wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    const response = await authService.updateProfile({ nama: name.trim(), email: email.trim() });
    if (response.success && response.data) {
      setSessionUser(response.data);
      setName(response.data.nama);
      setEmail(response.data.email);
      setSuccess("Profil berhasil diperbarui.");
    } else {
      setError(response.errors?.email ?? response.errors?.nama ?? response.message);
    }
    setSaving(false);
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
        <p className="mt-0.5 text-sm text-gray-500">Informasi akun yang tersimpan di backend POSmart</p>
      </div>

      <div className="flex items-start gap-5">
        <aside className="w-[220px] flex-shrink-0 rounded-[20px] bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gray-800 shadow-md">
              <span className="select-none text-xl font-bold text-white">{initials(currentUser?.nama ?? name)}</span>
            </div>
            <p className="mt-2 text-center text-sm font-bold text-gray-900">{currentUser?.nama || name || "Memuat..."}</p>
            <p className="text-xs text-gray-500">{currentUser ? roleLabels[currentUser.role] : "-"}</p>
            {currentUser && (
              <span className="mt-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold capitalize text-orange-600">
                {currentUser.role}
              </span>
            )}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2.5">
              <Calendar size={13} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400">Bergabung</p>
                <p className="text-sm font-bold text-gray-900">{joinedDate(currentUser?.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-gray-700">Pintasan</p>
            {[
              { label: "Buka POS Kasir", href: "/pos" },
              { label: "Lihat Transaksi", href: "/transactions" },
              { label: "Pengaturan Toko", href: "/settings" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B00]">
                {item.label}
                <ChevronRight size={13} className="text-gray-300" />
              </Link>
            ))}
          </div>

          <button type="button" onClick={() => void logout()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">
            <LogOut size={13} />
            Keluar Akun
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <form onSubmit={saveProfile} className="rounded-[20px] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Informasi Umum</p>
                <p className="mt-0.5 text-xs text-gray-400">Nama dan email akun aktif</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
                <UserRound size={17} />
              </div>
            </div>

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Nama Lengkap</label>
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={loading || saving} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-300 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Jabatan</label>
                <input value={currentUser ? roleLabels[currentUser.role] : ""} readOnly className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading || saving} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 outline-none focus:border-orange-300 disabled:bg-gray-50" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={14} />
                Data terhubung ke akun login
              </div>
              <button type="submit" disabled={loading || saving} className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </DashboardLayout>
  );
}
