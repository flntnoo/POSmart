"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useSession } from "@/contexts/SessionContext";
import { outletService } from "@/services";
import {
  ChevronRight, Store, User, Bell, Shield,
  Globe, CreditCard, Printer, Package, MessageSquare,
  Receipt, Save, Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SettingItem = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
};


// ── Data ───────────────────────────────────────────────────────────────────────

const settingItems: SettingItem[] = [
  {
    icon: <Store size={16} className="text-white" />,
    iconBg: "bg-[#FF6B00]",
    title: "Profil Bisnis",
    desc: "Nama toko, alamat, dan informasi pajak",
  },
  {
    icon: <User size={16} className="text-white" />,
    iconBg: "bg-blue-500",
    title: "Informasi Pribadi",
    desc: "Email, password, dan foto profil",
  },
  {
    icon: <Bell size={16} className="text-white" />,
    iconBg: "bg-sky-400",
    title: "Notifikasi",
    desc: "Email, WhatsApp, dan push notification",
  },
  {
    icon: <Shield size={16} className="text-white" />,
    iconBg: "bg-amber-400",
    title: "Keamanan",
    desc: "Two-factor auth dan kontrol akses",
  },
  {
    icon: <Globe size={16} className="text-white" />,
    iconBg: "bg-pink-500",
    title: "Lokalisasi",
    desc: "Mata uang, zona waktu, dan bahasa",
  },
  {
    icon: <CreditCard size={16} className="text-white" />,
    iconBg: "bg-teal-500",
    title: "Pembayaran",
    desc: "Metode bayar dan rekening bank",
  },
];

// ── Toggle component ───────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-[#FF6B00]" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [outletId, setOutletId]       = useState("");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  // Konfigurasi Toko form
  const [storeName, setStoreName]   = useState("");
  const [address, setAddress]       = useState("");
  const [phone, setPhone]           = useState("");
  const [taxRate, setTaxRate]       = useState("0");

  // Preferensi toggles
  const [printAuto, setPrintAuto]   = useState(false);
  const [stockAlert, setStockAlert] = useState(true);
  const [waReport, setWaReport]     = useState(false);
  const [taxAuto, setTaxAuto]       = useState(false);

  useEffect(() => {
    let mounted = true;
    outletService.list({ userId: currentUserId }).then((response) => {
      if (!mounted) return;
      const outlet = response.success && response.data ? response.data[0] : undefined;
      if (outlet) {
        setOutletId(outlet.outletId);
        setStoreName(outlet.nama);
        setAddress(outlet.alamat ?? "");
        setPhone(outlet.telepon ?? "");
        setTaxRate(String(outlet.taxRate));
        setPrintAuto(outlet.printReceiptAuto);
        setStockAlert(outlet.lowStockAlert);
        setWaReport(outlet.dailyWhatsappReport);
        setTaxAuto(outlet.autoTax);
      } else if (!response.success) {
        setError(response.message);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [currentUserId]);

  async function saveSettings() {
    if (!storeName.trim()) {
      setError("Nama toko wajib diisi.");
      return;
    }
    const parsedTaxRate = Number(taxRate);
    if (!Number.isFinite(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
      setError("Tarif pajak harus berada di antara 0 dan 100.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    const input = {
      nama: storeName.trim(),
      alamat: address.trim() || undefined,
      telepon: phone.trim() || undefined,
      taxRate: parsedTaxRate,
      printReceiptAuto: printAuto,
      lowStockAlert: stockAlert,
      dailyWhatsappReport: waReport,
      autoTax: taxAuto,
    };
    const response = outletId
      ? await outletService.update(outletId, input)
      : await outletService.create({ ...input, userId: currentUserId });
    if (response.success && response.data) {
      setOutletId(response.data.outletId);
      setSuccess("Pengaturan toko berhasil disimpan ke backend.");
    } else {
      setError(response.errors?.nama ?? response.message);
    }
    setSaving(false);
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="mt-0.5 text-sm text-gray-500">Kelola akun dan preferensi aplikasi Anda</p>
      </div>

      <div className="flex items-start gap-5">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Pengaturan Umum */}
          <div className="rounded-[20px] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-gray-800">Pengaturan Umum</p>
            <div className="grid grid-cols-3 gap-3">
              {settingItems.map(item => (
                <button key={item.title}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50 group">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── Konfigurasi Toko sidebar ── */}
        <div className="w-[268px] flex-shrink-0">
          <div className="rounded-[20px] bg-white p-5 shadow-sm">
            {/* Store icon */}
            <div className="mb-3 flex flex-col items-center">
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-md"
                style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FFB347 100%)" }}
              >
                <Store size={28} className="text-white" />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 border-2 border-white">
                  <span className="text-[8px] font-black text-orange-600">✓</span>
                </div>
              </div>
              <p className="mt-2.5 text-sm font-bold text-gray-900">{loading ? "Memuat..." : storeName || "Outlet belum tersedia"}</p>
              <p className="text-[11px] text-gray-400">Data outlet utama</p>
            </div>

            {success && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-3">
              {/* Nama Toko */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Nama Toko</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)}
                  disabled={loading || saving}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-300 disabled:bg-gray-50" />
              </div>

              {/* Alamat */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Alamat</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Jl. Contoh No. 1"
                  disabled={loading || saving}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300 disabled:bg-gray-50" />
              </div>

              {/* Telepon */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Telepon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Contoh: +62 812 3456 7890"
                  disabled={loading || saving}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300 disabled:bg-gray-50" />
              </div>

              {/* Tarif Pajak */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Tarif Pajak PPN (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-300" />
              </div>
            </div>

            {/* Preferensi toggles */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Preferensi</p>
              <div className="space-y-3">
                {([
                  { label: "Cetak struk otomatis",  icon: <Printer size={12} />, on: printAuto,  set: setPrintAuto  },
                  { label: "Alert stok menipis",    icon: <Package size={12} />, on: stockAlert, set: setStockAlert },
                  { label: "Laporan harian via WA", icon: <MessageSquare size={12} />, on: waReport,  set: setWaReport  },
                  { label: "Tambah pajak otomatis", icon: <Receipt size={12} />, on: taxAuto,   set: setTaxAuto    },
                ] as { label: string; icon: React.ReactNode; on: boolean; set: (v: boolean) => void }[]).map(p => (
                  <div key={p.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{p.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{p.label}</span>
                    </div>
                    <Toggle on={p.on} onToggle={() => p.set(!p.on)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button type="button" onClick={saveSettings} disabled={loading || saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
