"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, User, Settings, CreditCard, LogOut, ChevronRight, Shield } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { roleLabels } from "@/lib/rbac";

const MENU_ITEMS = [
  {
    icon: User,
    label: "Profil Saya",
    desc: "Kelola akun dan preferensi",
    href: "/profile",
    color: "text-gray-600",
  },
  {
    icon: Settings,
    label: "Pengaturan",
    desc: "Konfigurasi toko & aplikasi",
    href: "/settings",
    color: "text-gray-600",
  },
  {
    icon: Shield,
    label: "Keamanan",
    desc: "Password & verifikasi 2FA",
    href: "/profile",
    color: "text-gray-600",
  },
  {
    icon: CreditCard,
    label: "Subscription & Billing",
    desc: "Paket POSmart aktif",
    href: "/subscription",
    color: "text-gray-600",
  },
];

export default function TopBar() {
  const router = useRouter();
  const { currentUser, currentRole, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const role = currentRole ?? "owner";
  const initials = (currentUser?.nama ?? "G").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5">
      <div className="flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100">
          <Menu size={18} />
        </button>
        <div className="relative w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk, transaksi..."
            className="w-full rounded-xl bg-gray-100 py-2 pl-9 pr-4 text-sm text-gray-600 placeholder:text-gray-400 outline-none transition-colors focus:bg-gray-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100">
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
        </button>

        {/* Avatar + dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(p => !p)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-800 transition-all hover:ring-2 hover:ring-orange-400 hover:ring-offset-1"
          >
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </button>

          {open && (
            <div className="absolute right-0 top-11 z-50 w-[260px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
              {/* User info header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-800">
                  <span className="text-[11px] font-bold text-white">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{currentUser?.nama ?? "Guest"}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser?.email ?? "Belum login"}</p>
                </div>
                <span className="ml-auto flex-shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                  {roleLabels[role]}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {MENU_ITEMS.map(item => (
                  <Link key={item.href + item.label} href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 group">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-orange-50 transition-colors">
                      <item.icon size={14} className="text-gray-500 group-hover:text-[#FF6B00] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight size={13} className="flex-shrink-0 text-gray-300 group-hover:text-gray-400" />
                  </Link>
                ))}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => { setOpen(false); void logout().finally(() => router.push("/login")); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                    <LogOut size={14} className="text-red-500" />
                  </div>
                  Keluar Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
