"use client";

import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  ChevronRight, Store, User, Bell, Shield,
  Globe, CreditCard, ExternalLink, CheckCircle2,
  Circle, Printer, Package, MessageSquare, Receipt,
  Save,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SettingItem = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
};

type Integration = {
  id: string;
  name: string;
  desc: string;
  abbr: string;
  color: string;
  textColor: string;
  badge?: string;
  badgeColor?: string;
  connected: boolean;
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

const defaultIntegrations: Integration[] = [
  {
    id: "midtrans", name: "Midtrans", desc: "Payment Gateway Indonesia",
    abbr: "MT", color: "#1E3A8A", textColor: "#FFFFFF",
    badge: "Future", badgeColor: "bg-blue-100 text-blue-700",
    connected: true,
  },
  {
    id: "whatsapp", name: "WhatsApp Business", desc: "Notifikasi & pesan otomatis",
    abbr: "WA", color: "#16A34A", textColor: "#FFFFFF",
    connected: true,
  },
  {
    id: "cloudinary", name: "Cloudinary", desc: "Cloud storage untuk gambar",
    abbr: "CL", color: "#6366F1", textColor: "#FFFFFF",
    connected: false,
  },
  {
    id: "google", name: "Google OAuth", desc: "Login dengan akun Google",
    abbr: "G", color: "#EA4335", textColor: "#FFFFFF",
    connected: true,
  },
  {
    id: "tokopedia", name: "Tokopedia", desc: "Sync produk & pesanan",
    abbr: "TK", color: "#00AA5B", textColor: "#FFFFFF",
    badge: "Pro", badgeColor: "bg-green-100 text-green-700",
    connected: false,
  },
  {
    id: "gopay", name: "GoPay / OVO", desc: "Dompet digital/e-wallet",
    abbr: "$", color: "#F59E0B", textColor: "#FFFFFF",
    connected: false,
  },
];

// ── Toggle component ───────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-[#FF6B00]" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);

  // Konfigurasi Toko form
  const [storeName, setStoreName]   = useState("Toko Berkah Jaya");
  const [address, setAddress]       = useState("");
  const [phone, setPhone]           = useState("+62 211234 5678");
  const [timezone, setTimezone]     = useState("WIB (UTC+7)");
  const [currency, setCurrency]     = useState("IDR");
  const [taxRate, setTaxRate]       = useState("10");

  // Preferensi toggles
  const [printAuto, setPrintAuto]   = useState(true);
  const [stockAlert, setStockAlert] = useState(true);
  const [waReport, setWaReport]     = useState(false);
  const [taxAuto, setTaxAuto]       = useState(true);

  function toggleConnect(id: string) {
    setIntegrations(prev =>
      prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i)
    );
  }

  const connected = integrations.filter(i => i.connected).length;
  const total     = integrations.length;

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

          {/* Integrasi */}
          <div className="rounded-[20px] bg-white p-5 shadow-sm">
            {/* Section header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-bold text-gray-800">Integrasi</p>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-600">
                  {connected}/{total} terhubung
                </span>
              </div>
              <button className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#FF6B00] transition-colors">
                <Circle size={10} className="text-orange-400" />
                Jelajahi Semua
              </button>
            </div>

            {/* Stats row */}
            <div className="mb-4 grid grid-cols-4 gap-2.5">
              {[
                { label: "Total", value: String(total), color: "text-blue-600" },
                { label: "Terhubung", value: String(connected), color: "text-green-600" },
                { label: "Belum", value: String(total - connected), color: "text-orange-500" },
                { label: "Future", value: "Siap", color: "text-purple-600" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center rounded-xl bg-gray-50 py-3">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Integration cards */}
            <div className="grid grid-cols-2 gap-3">
              {integrations.map(ig => (
                <div key={ig.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3.5">
                  {/* Logo */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
                    style={{ background: ig.color, color: ig.textColor }}
                  >
                    {ig.abbr}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{ig.name}</span>
                      {ig.badge && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${ig.badgeColor}`}>
                          {ig.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-400">{ig.desc}</p>

                    {/* Status + button */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {ig.connected
                          ? <CheckCircle2 size={12} className="text-green-500" />
                          : <Circle size={12} className="text-gray-300" />
                        }
                        <span className={`text-[11px] font-semibold ${ig.connected ? "text-green-600" : "text-gray-400"}`}>
                          {ig.connected ? "Aktif" : "Belum terhubung"}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleConnect(ig.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          ig.connected
                            ? "border border-gray-200 text-gray-500 hover:bg-gray-50"
                            : "bg-[#FF6B00] text-white hover:bg-[#E05E00]"
                        }`}
                      >
                        {ig.connected ? "Konfigurasi" : "Hubungkan"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA banner */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200">
                  <ExternalLink size={13} className="text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Integrasi future-ready</p>
                  <p className="text-[11px] text-gray-500">Konektor eksternal disiapkan untuk fase backend</p>
                </div>
              </div>
              <button className="rounded-xl bg-[#FF6B00] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#E05E00] transition-colors">
                Lihat Rencana
              </button>
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
              <p className="mt-2.5 text-sm font-bold text-gray-900">{storeName || "Nama Toko"}</p>
              <p className="text-[11px] text-gray-400">POSmart MVP</p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              {/* Nama Toko */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Nama Toko</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-300" />
              </div>

              {/* Alamat */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Alamat</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Jl. Contoh No. 1"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
              </div>

              {/* Telepon */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Telepon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-300" />
              </div>

              {/* Zona Waktu + Mata Uang */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Zona Waktu</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-2 py-2 text-xs text-gray-900 outline-none focus:border-orange-300 bg-white">
                    <option>WIB (UTC+7)</option>
                    <option>WITA (UTC+8)</option>
                    <option>WIT (UTC+9)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Mata Uang</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-2 py-2 text-xs text-gray-900 outline-none focus:border-orange-300 bg-white">
                    <option>IDR</option>
                    <option>USD</option>
                    <option>SGD</option>
                  </select>
                </div>
              </div>

              {/* Tarif Pajak */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Tarif Pajak PPN (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)}
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
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
              <Save size={14} />
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
