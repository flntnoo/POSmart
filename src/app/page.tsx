"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Zap, ArrowRight } from "lucide-react";

// ── Hero + Navbar (shared orange background) ──────────────────────────────────
function HeroSection() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF9140 55%, #FFB84D 100%)" }}
    >
      {/* Subtle decorative blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-white/5" />

      {/* ── Navbar ── */}
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-8 pt-6 pb-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/sidebar/logo.svg"
            alt="POSmart"
            width={130}
            height={34}
            className="brightness-0 invert"
            priority
          />
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {["Features", "Pricing", "Contact"].map(n => (
            <a
              key={n}
              href={`#${n.toLowerCase()}`}
              className="text-sm font-semibold text-white/85 transition-colors hover:text-white"
            >
              {n}
            </a>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-white/85 transition-colors hover:text-white">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#FF6B00] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero body ── */}
      <div className="relative mx-auto flex max-w-7xl items-end gap-0 px-8 pt-10">
        {/* Left: copy */}
        <div className="flex-1 pb-20">
          <h1 className="text-6xl font-extrabold leading-[1.1] text-white">
            Sell Faster,<br />
            Grow Smarter
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
            POSmart membantu bisnis anda mencatat Transaksi, memantau stok,
            mengelola pelanggan, dan membaca pola penjualan dalam satu platform
            yang simple dan modern.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-full border-2 border-white/70 px-7 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/15"
          >
            Mulai!
          </Link>
        </div>

        {/* Right: hero image */}
        <div className="hidden flex-1 items-end justify-center md:flex">
          <Image
            src="/LandingPage/awal.svg"
            alt="POSmart App"
            width={560}
            height={430}
            className="relative z-10 drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <div className="grid grid-cols-3 gap-5">
            {[
              {
                svg: "/LandingPage/TransaksiCepat.svg",
                title: "Transaksi Cepat",
                desc: "Proses transaksi dengan kecepatan tinggi dalam berbagai metode pembayaran digital.",
              },
              {
                svg: "/LandingPage/PantauStock.svg",
                title: "Pantau Stok",
                desc: "Pantau stok produk secara real-time dan notifikasi otomatis saat stok menipis.",
              },
              {
                svg: "/LandingPage/Laporan.svg",
                title: "Laporan",
                desc: "Akses laporan penjualan lengkap untuk pengambilan keputusan bisnis yang lebih baik.",
              },
            ].map(s => (
              <div key={s.title} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                  <Image src={s.svg} alt={s.title} width={30} height={30} />
                </div>
                <p className="text-sm font-bold text-gray-900">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { svg: "/LandingPage/PointofSale.svg", title: "Point of Sale", desc: "Kasir cepat, multi-metode bayar, struk otomatis", bg: "bg-orange-50" },
  { svg: "/LandingPage/InventoryManagement.svg", title: "Inventory Management", desc: "Pantau stok real-time, alert stok menipis, laporan", bg: "bg-blue-50" },
  { svg: "/LandingPage/CRM.svg", title: "CRM", desc: "Kelola pelanggan, riwayat pembelian, program loyalitas", bg: "bg-green-50" },
  { svg: "/LandingPage/SupplierManagement.svg", title: "Supplier Management", desc: "Kelola supplier, purchase order, dan hutang piutang", bg: "bg-purple-50" },
  { svg: "/LandingPage/SalesAnalytics.svg", title: "Sales Analytics", desc: "Dashboard analitik lengkap dengan grafik interaktif", bg: "bg-pink-50" },
  { svg: "/LandingPage/Real-TimeSync.svg", title: "Real-time Sync", desc: "Semua data tersinkron di semua perangkat secara instan", bg: "bg-teal-50" },
];

function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Fitur Lengkap untuk Bisnis Anda</h2>
          <p className="mt-3 text-base text-gray-500">Semua yang Anda butuhkan ada di sini, dalam satu platform terintegrasi</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title}
              className="group rounded-2xl border border-gray-100 p-6 transition-all hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg}`}>
                <Image src={f.svg} alt={f.title} width={34} height={34} />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-gray-900">{f.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free", priceLabel: "Gratis", unit: "/bulan",
    features: ["1 Owner", "Data awal terbatas", "Payment record mock"],
    cta: "Pilih Paket", popular: false,
  },
  {
    name: "Basic", priceLabel: "Rp 299K", unit: "/bulan",
    features: ["Multi produk", "Inventory dasar", "Dashboard penjualan", "Payment record"],
    cta: "Pilih Paket", popular: true,
  },
  {
    name: "Pro", priceLabel: "Rp 599K", unit: "/bulan",
    features: ["Semua fitur Basic", "Multi outlet", "Analytics dasar", "Prioritas support"],
    cta: "Pilih Paket", popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Pilih Paket yang Tepat</h2>
          <p className="mt-3 text-base text-gray-500">Mulai dari gratis, scale sesuai kebutuhan bisnis Anda</p>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 p-7 transition-all duration-300 ${plan.popular
                ? "border-[#FF6B00] shadow-xl shadow-orange-100 scale-[1.05] z-10 bg-white"
                : "border-gray-200 bg-white hover:-translate-y-3 hover:border-[#FF6B00] hover:shadow-xl hover:shadow-orange-100"
                }`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#FF6B00] px-4 py-1 text-[11px] font-bold text-white">Rekomendasi</span>
                </div>
              )}
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">{plan.name}</p>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.priceLabel}</span>
                <span className="text-sm text-gray-400">{plan.unit}</span>
              </div>
              <div className="my-5 flex-1 space-y-2.5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={13} strokeWidth={3}
                      className={`mt-0.5 flex-shrink-0 ${plan.popular ? "text-[#FF6B00]" : "text-green-500"}`} />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${plan.popular
                  ? "bg-[#FF6B00] text-white hover:bg-[#E05E00]"
                  : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}>
                <span className="flex items-center justify-center gap-1.5"><Zap size={13} /> {plan.cta}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Dark ──────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section id="contact" className="py-20" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white">Siap menyederhanakan operasional bisnis?</h2>
        <p className="mt-4 text-base text-gray-400">
          Bergabung dengan ratusan UMKM yang terus berkembang bersama
        </p>
        <div className="mt-2 flex justify-center">
          <Image src="/LandingPage/posmart.svg" alt="POSmart" width={140} height={40} className="brightness-0 invert" />
        </div>
        <div className="mt-7 flex items-center justify-center gap-4">
          <Link href="/register"
            className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/30 transition-all hover:bg-[#E05E00] hover:-translate-y-0.5">
            Get Started Now <ArrowRight size={14} />
          </Link>
          <a href="#pricing"
            className="rounded-xl border border-gray-600 px-7 py-3 text-sm font-bold text-gray-300 transition-colors hover:border-gray-400 hover:text-white">
            Lihat Paket
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0f0f1a] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="mb-3">
              <Image src="/LandingPage/posmart.svg" alt="POSmart" width={130} height={36} className="brightness-0 invert" />
            </div>
            <p className="max-w-[200px] text-xs leading-relaxed text-gray-500">
              Platform POS modern untuk UMKM Indonesia. Jualan lebih cepat, bisnis lebih cerdas.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {["f", "𝕏", "ig", "▶"].map((icon, i) => (
                <button key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-800 text-[11px] font-bold text-gray-400 transition-colors hover:bg-[#FF6B00] hover:text-white">
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {[
            { title: "Produk", links: ["Point of Sale", "Inventory", "CRM", "Analytics"] },
            { title: "Company", links: ["Tentang Kami", "Blog", "Karir", "Press Kit"] },
            { title: "Legal", links: ["Privasi", "Terms", "Cookie Policy"] },
          ].map(col => (
            <div key={col.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 transition-colors hover:text-orange-400">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-600">© 2026 POSmart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <HeroSection />
      <Features />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
}
