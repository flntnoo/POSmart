"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  formatRpShort, toSupplierView,
  type Supplier, type SupplierStatus,
} from "@/data/suppliers";
import { auditLogService, productService, supplierService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import {
  Search, Plus, X, Mail, Phone, MapPin,
  ChevronRight, Package, History, Pencil,
  ShoppingCart, Building2, User, Receipt,
} from "lucide-react";

type StatusFilter = "Semua" | SupplierStatus;
const statusTabs: StatusFilter[] = ["Semua", "Lunas", "Hutang"];

const statusStyles: Record<SupplierStatus, string> = {
  Lunas:  "bg-teal-50 text-teal-600 border border-teal-200",
  Hutang: "bg-red-50 text-red-500 border border-red-200",
};

type AddForm = {
  name: string; contact: string; email: string; phone: string;
  city: string; country: string; category: string; terms: string; notes: string;
};
const emptyAdd: AddForm = {
  name: "", contact: "", email: "", phone: "",
  city: "", country: "", category: "", terms: "Net 30", notes: "",
};

export default function SuppliersPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId ?? "user-owner-001";
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<StatusFilter>("Semua");
  const [detail, setDetail]         = useState<Supplier | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState<AddForm>(emptyAdd);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supplierService.list({ userId: currentUserId }),
      productService.list({ userId: currentUserId }),
    ]).then(([supplierResponse, productResponse]) => {
      if (!mounted) return;
      const products = productResponse.success && productResponse.data ? productResponse.data : [];
      if (supplierResponse.success && supplierResponse.data) {
        setSuppliers(supplierResponse.data.map((supplier, index) => toSupplierView(supplier, index, products)));
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  const LOGO_COLORS = ["#FF6B00","#374151","#1D4ED8","#059669","#7C3AED","#DC2626","#D97706","#1E3A8A"];

  function handleAddSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const d = new Date();
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const today = `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const abbr = addForm.name.split(/\s+/).map(w => w[0] ?? "").join("").toUpperCase().slice(0, 3) || "SUP";
    const newSupplier: Supplier = {
      id:             `S-${String(suppliers.length + 1).padStart(3, "0")}`,
      name:           addForm.name,
      abbr,
      logoColor:      LOGO_COLORS[suppliers.length % LOGO_COLORS.length],
      contactPerson:  addForm.contact,
      email:          addForm.email,
      phone:          addForm.phone,
      city:           addForm.city,
      country:        addForm.country || "Indonesia",
      totalPurchases: 0,
      productCount:   0,
      debt:           0,
      lastOrder:      today,
      joinDate:       today,
      status:         "Lunas",
      recentTx:       [],
    };
    supplierService.create({
      userId: currentUserId,
      nama: newSupplier.name,
      kontak: newSupplier.phone || newSupplier.email,
    }).then((response) => {
      if (response.success && response.data) {
        setSuppliers(prev => [toSupplierView(response.data, prev.length, []), ...prev]);
      } else {
        setSuppliers(prev => [newSupplier, ...prev]);
      }
    });
    void auditLogService.create({
      userId: currentUserId,
      aksi: `Membuat supplier ${newSupplier.name}`,
      module: "suppliers",
    });
    setAddForm(emptyAdd);
    setShowAdd(false);
  }

  const stats = useMemo(() => {
    const aktif        = suppliers.filter(s => s.status === "Lunas").length;
    const totalBeli    = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
    const totalHutang  = suppliers.reduce((sum, s) => sum + s.debt, 0);
    return { aktif, totalBeli, totalHutang };
  }, [suppliers]);

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      if (statusFilter !== "Semua" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !s.contactPerson.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [suppliers, statusFilter, search]);

  function openDetail(s: Supplier) { setDetail(s); setShowAdd(false); }
  function openAdd()               { setShowAdd(true); setDetail(null); setAddForm(emptyAdd); }

  // ── ADD SUPPLIER FORM ──────────────────────────────────────────────────────
  if (showAdd) {
    return (
      <DashboardLayout>
        <div className="mb-1">
          <h1 className="text-xl font-bold text-gray-900">Supplier</h1>
        </div>
        <div className="mb-6 flex items-center gap-1 text-sm">
          <span className="text-gray-400">Dashboard</span>
          <ChevronRight size={13} className="text-gray-300" />
          <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            Supplier
          </button>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="font-semibold text-[#FF6B00]">Tambah Supplier</span>
        </div>

        <div className="max-w-[600px] rounded-[20px] bg-white p-8 shadow-sm">
          {/* Form header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
              <Building2 size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tambah Supplier Baru</h2>
              <p className="text-sm text-gray-400">Lengkapi informasi perusahaan dan kontak supplier</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleAddSubmit}>
            {/* Section: Info Perusahaan */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Info Perusahaan</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama Supplier / Perusahaan</label>
                  <input type="text" placeholder="Contoh: Adidas Group" value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kota</label>
                    <input type="text" placeholder="Contoh: Jakarta" value={addForm.city}
                      onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Negara</label>
                    <input type="text" placeholder="Contoh: Indonesia" value={addForm.country}
                      onChange={e => setAddForm(f => ({ ...f, country: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kategori Produk</label>
                  <input type="text" placeholder="Contoh: Bahan baku, kemasan" value={addForm.category}
                    onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            {/* Section: Kontak */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Kontak Person</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama Kontak</label>
                  <input type="text" placeholder="Nama PIC / kontak person" value={addForm.contact}
                    onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                    <input type="email" placeholder="email@supplier.com" value={addForm.email}
                      onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">No. Telepon</label>
                    <input type="tel" placeholder="+62..." value={addForm.phone}
                      onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            {/* Section: Terms */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Terms Pembayaran</p>
              <div className="grid grid-cols-4 gap-2">
                {["COD", "Net 15", "Net 30", "Net 60"].map(t => (
                  <button type="button" key={t} onClick={() => setAddForm(f => ({ ...f, terms: t }))}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                      addForm.terms === t
                        ? "border-orange-400 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Catatan <span className="font-normal text-gray-400">(opsional)</span></label>
              <textarea rows={3} placeholder="Informasi tambahan tentang supplier ini..." value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-300 outline-none focus:border-orange-300" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                Batal
              </button>
              <button type="submit"
                className="flex-1 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
                Simpan Supplier
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  // ── MAIN LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Supplier</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola hubungan dan pembelian dari supplier</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]">
          <Plus size={15} strokeWidth={2.5} />
          Tambah Supplier
        </button>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-4 gap-4">
        {/* Card 1 – orange gradient */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF9500 60%, #FFB347 100%)" }}
        >
          <div className="pointer-events-none absolute -right-7 -top-7 h-36 w-36 rounded-full border-2 border-white/20" />
          <div className="pointer-events-none absolute -right-1 -top-1 h-20 w-20 rounded-full border-2 border-white/20" />
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <Building2 size={16} className="text-white" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Total Supplier</p>
          <p className="mt-0.5 text-4xl font-extrabold text-white">{suppliers.length}</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-white/70">
            +12.5% bulan ini
            <span className="inline-block rotate-45 text-green-300">→</span>
          </p>
        </div>

        {/* Card 2 – Supplier Aktif */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
            <ShoppingCart size={16} className="text-[#FF6B00]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Supplier Aktif</p>
          <p className="mt-0.5 text-4xl font-extrabold text-gray-900">{stats.aktif}</p>
        </div>

        {/* Card 3 – Total Pembelian */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
            <Package size={16} className="text-[#FF6B00]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Pembelian</p>
          <p className="mt-0.5 text-3xl font-extrabold text-gray-900">{formatRpShort(stats.totalBeli)}</p>
          <p className="mt-2 text-[11px] font-semibold text-green-500">+12.5% bulan ini ↗</p>
        </div>

        {/* Card 4 – Nilai Hutang */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
            <Receipt size={16} className="text-[#FF6B00]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Nilai Hutang</p>
          <p className={`mt-0.5 text-3xl font-extrabold ${stats.totalHutang > 0 ? "text-red-500" : "text-gray-900"}`}>
            {formatRpShort(stats.totalHutang)}
          </p>
          {stats.totalHutang === 0
            ? <p className="mt-2 text-[11px] text-gray-400">Tidak punya hutang ✓</p>
            : <p className="mt-2 text-[11px] font-semibold text-red-400">{suppliers.filter(s => s.debt > 0).length} supplier belum lunas</p>
          }
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari transaksi atau pelanggan..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-300" />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-gray-100/80 p-1">
          {statusTabs.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">
          {filtered.length} supplier
        </span>
      </div>

      {/* Content */}
      <div className="flex items-start gap-5">
        {/* Table */}
        <div className={`overflow-hidden rounded-[20px] bg-white shadow-sm ${detail ? "flex-1 min-w-0" : "w-full"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">No.</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Supplier</th>
                {!detail && <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Kontak</th>}
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Alamat</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Pembelian</th>
                {!detail && <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Terakhir Order</th>}
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const isSelected = detail?.id === s.id;
                return (
                  <tr key={s.id} onClick={() => openDetail(s)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${i < filtered.length - 1 ? "border-b border-gray-50" : ""} ${isSelected ? "bg-orange-50/40" : ""}`}>
                    {/* No */}
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-400">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    {/* Supplier */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold text-white"
                          style={{ background: s.logoColor }}
                        >
                          {s.abbr}
                        </div>
                        <span className="font-semibold text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    {/* Kontak */}
                    {!detail && (
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-600">{s.email}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{s.phone}</p>
                      </td>
                    )}
                    {/* Alamat */}
                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {s.city}, {s.country}
                    </td>
                    {/* Total */}
                    <td className="px-4 py-3.5 font-semibold text-gray-800">
                      {formatRpShort(s.totalPurchases)}
                    </td>
                    {/* Last Order */}
                    {!detail && (
                      <td className="px-4 py-3.5 text-xs text-gray-500">{s.lastOrder}</td>
                    )}
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyles[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={detail ? 5 : 7} className="py-14 text-center text-sm text-gray-400">Tidak ada supplier ditemukan</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-400">Menampilkan {filtered.length} dari {suppliers.length} supplier</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(page => (
                <button key={page}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === 1 ? "bg-[#FF6B00] text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}>
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Supplier panel */}
        {detail && (
          <div className="w-[285px] flex-shrink-0 overflow-hidden rounded-[20px] bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-bold text-gray-700">Detail Supplier</span>
              <button onClick={() => setDetail(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={14} />
              </button>
            </div>

            {/* Logo + name */}
            <div className="flex flex-col items-center px-5 pb-4">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-extrabold text-white shadow-md"
                style={{ background: detail.logoColor }}
              >
                {detail.abbr}
              </div>
              <p className="mt-2.5 text-base font-bold text-gray-900 text-center">{detail.name}</p>
              <span className={`mt-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${statusStyles[detail.status]}`}>
                {detail.status}
              </span>
            </div>

            <div className="mx-5 border-t border-gray-100" />

            {/* Contact */}
            <div className="space-y-2 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <User size={13} className="flex-shrink-0 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">{detail.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={13} className="flex-shrink-0 text-gray-400" />
                <span className="truncate text-sm font-medium text-gray-600">{detail.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={13} className="flex-shrink-0 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">{detail.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={13} className="flex-shrink-0 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">{detail.city}, {detail.country}</span>
              </div>
            </div>

            {/* Stats 3-col */}
            <div className="mx-5 mb-4 grid grid-cols-3 gap-1.5">
              <div className="flex flex-col items-center rounded-xl bg-[#FF6B00] px-1 py-3">
                <p className="text-xs font-extrabold text-white leading-tight">{formatRpShort(detail.totalPurchases)}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-white/70">Pembelian</p>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-gray-50 px-1 py-3">
                <p className="text-xl font-extrabold text-gray-900 leading-tight">{detail.productCount}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-gray-400">Produk</p>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-gray-50 px-1 py-3">
                <p className={`text-lg font-extrabold leading-tight ${detail.debt > 0 ? "text-red-500" : "text-gray-900"}`}>
                  {detail.debt > 0 ? formatRpShort(detail.debt) : "0"}
                </p>
                <p className="mt-0.5 text-[9px] font-semibold text-gray-400">Hutang</p>
              </div>
            </div>

            {/* Riwayat */}
            <div className="px-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Riwayat Transaksi</p>
              <div className="space-y-3">
                {detail.recentTx.map((tx, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white"
                      style={{ background: detail.logoColor }}
                    >
                      {detail.abbr}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-800">{tx.name}</p>
                      <p className="text-[10px] text-gray-400">{tx.date}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold text-green-600">
                      +{tx.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 p-5">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
                <History size={14} />
                Lihat Semua Transaksi
              </button>
              <button className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-600">
                <Pencil size={13} />
                Edit Profil
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
