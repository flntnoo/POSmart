"use client";

import Image from "next/image";
import Link from "next/link";
import SidebarItem from "./SidebarItem";
import { getSidebarMenus } from "./navigation";
import { useSession } from "@/contexts/SessionContext";
import { roleLabels } from "@/lib/rbac";

export default function Sidebar() {
  const { currentUser, currentRole } = useSession();
  const role = currentRole ?? "owner";
  const { mainMenu, managementMenu, systemMenu } = getSidebarMenus(role);

  return (
    <aside className="group/sidebar fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col bg-[#F4E6D4] overflow-hidden transition-[width] duration-300 ease-in-out hover:w-64">

      {/* Logo */}
      <div className="flex h-[68px] flex-shrink-0 items-center px-[18px] group-hover/sidebar:px-5 transition-[padding] duration-300 overflow-hidden">
        <div className="w-9 overflow-hidden group-hover/sidebar:w-[148px] transition-[width] duration-300 flex-shrink-0">
          <Image
            src="/icons/sidebar/logo.svg"
            alt="POSmart"
            width={226}
            height={43}
            priority
            style={{ width: "226px", height: "43px", maxWidth: "none" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 pb-4">
        <div className="flex items-center rounded-2xl bg-[#EEDECB] py-2.5 pl-[15px] group-hover/sidebar:pl-3 overflow-hidden transition-[padding] duration-300">
          <Image
            src="/icons/sidebar/search.svg"
            alt="Search"
            width={16}
            height={16}
            className="flex-shrink-0"
          />
          <div className="overflow-hidden w-0 group-hover/sidebar:w-full transition-[width] duration-300">
            <input
              type="text"
              placeholder="Cari produk, transaksi..."
              className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pl-2.5 whitespace-nowrap"
            />
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2 [&::-webkit-scrollbar]:hidden">

        {/* Section: Menu */}
        <div className="h-5 overflow-hidden mb-1">
          <p className="pl-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Menu
          </p>
        </div>

        <div className="space-y-0.5">
          {mainMenu.map((item) => (
            <SidebarItem key={item.href} label={item.name} href={item.href} iconPath={item.iconPath} />
          ))}
        </div>

        <div className="my-4 border-t-2 border-[#C9A87A]" />

        {/* Section: Manajemen */}
        <div className="h-5 overflow-hidden mb-1">
          <p className="pl-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Manajemen
          </p>
        </div>

        <div className="space-y-0.5">
          {managementMenu.map((item) => (
            <SidebarItem key={item.href} label={item.name} href={item.href} iconPath={item.iconPath} />
          ))}
        </div>

        <div className="my-4 border-t-2 border-[#C9A87A]" />

        {/* System items (no section label) */}
        <div className="space-y-0.5">
          {systemMenu.map((item) => (
            <SidebarItem key={item.href} label={item.name} href={item.href} iconPath={item.iconPath} />
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t-2 border-[#C9A87A] px-3 py-4 space-y-3">

        {/* Theme toggle — only visible when expanded */}
        <div className="overflow-hidden rounded-xl bg-[#EEDECB] p-1 max-h-0 group-hover/sidebar:max-h-16 opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300">
          <div className="flex">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-1.5 text-xs font-medium text-gray-800 shadow-sm">
              <Image src="/icons/sidebar/sun.svg" alt="Light" width={13} height={13} />
              Light
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500">
              <Image src="/icons/sidebar/moon.svg" alt="Dark" width={13} height={13} />
              Dark
            </button>
          </div>
        </div>

        {/* Profile card */}
        <Link href="/profile" className="block rounded-xl bg-white p-2.5 transition-colors hover:bg-orange-50">
          <div className="flex items-center">
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {(currentUser?.nama ?? "G").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 overflow-hidden max-w-0 group-hover/sidebar:max-w-[160px] opacity-0 group-hover/sidebar:opacity-100 ml-0 group-hover/sidebar:ml-3 transition-all duration-300 whitespace-nowrap">
              <p className="text-xs font-semibold text-gray-800 truncate">{currentUser?.nama ?? "Guest"}</p>
              <p className="text-[10px] font-medium text-orange-500 truncate">{roleLabels[role]}</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
