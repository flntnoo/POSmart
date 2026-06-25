"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { toSupplierView, type Supplier } from "@/data/suppliers";
import { productService, supplierService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import {
  Building2,
  ChevronRight,
  Package,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";

type AddForm = {
  name: string;
  contact: string;
};

const emptyAdd: AddForm = {
  name: "",
  contact: "",
};

export default function SuppliersPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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

  function handleAddSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    supplierService.create({
      userId: currentUserId,
      nama: addForm.name,
      kontak: addForm.contact || undefined,
    }).then((response) => {
      if (response.success && response.data) {
        setSuppliers((current) => [toSupplierView(response.data!, current.length, []), ...current]);
      }
    });
    setAddForm(emptyAdd);
    setShowAdd(false);
  }

  const stats = useMemo(() => {
    const linkedProducts = suppliers.reduce((sum, supplier) => sum + supplier.productCount, 0);
    const withContact = suppliers.filter((supplier) => supplier.contact !== "-").length;
    return {
      linkedProducts,
      withContact,
      withoutContact: suppliers.length - withContact,
    };
  }, [suppliers]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return suppliers.filter((supplier) => (
      !query ||
      supplier.name.toLowerCase().includes(query) ||
      supplier.contact.toLowerCase().includes(query)
    ));
  }, [search, suppliers]);

  if (showAdd) {
    return (
      <DashboardLayout>
        <div className="mb-1">
          <h1 className="text-xl font-bold text-gray-900">Supplier</h1>
        </div>
        <div className="mb-6 flex items-center gap-1 text-sm">
          <span className="text-gray-400">Dashboard</span>
          <ChevronRight size={13} className="text-gray-300" />
          <button onClick={() => setShowAdd(false)} className="text-gray-400 transition-colors hover:text-gray-600">
            Supplier
          </button>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="font-semibold text-[#FF6B00]">Tambah Supplier</span>
        </div>

        <div className="max-w-[600px] rounded-[20px] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
              <Building2 size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tambah Supplier Baru</h2>
              <p className="text-sm text-gray-400">Simpan nama dan kontak supplier</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleAddSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama Supplier / Perusahaan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Nusantara Roastery"
                value={addForm.name}
                onChange={(event) => setAddForm((form) => ({ ...form, name: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kontak</label>
              <input
                type="text"
                placeholder="Nomor telepon atau email"
                value={addForm.contact}
                onChange={(event) => setAddForm((form) => ({ ...form, contact: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]"
              >
                Simpan Supplier
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Supplier</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola data supplier dan produk yang terhubung</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setDetail(null);
            setAddForm(emptyAdd);
          }}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Tambah Supplier
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-[20px] bg-[#FF6B00] p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <Building2 size={16} className="text-white" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Total Supplier</p>
          <p className="mt-0.5 text-4xl font-extrabold text-white">{suppliers.length}</p>
          <p className="mt-2 text-[11px] font-semibold text-white/70">Data supplier backend</p>
        </div>
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <Phone size={16} className="mb-2 text-[#FF6B00]" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Kontak Tersedia</p>
          <p className="mt-0.5 text-4xl font-extrabold text-gray-900">{stats.withContact}</p>
        </div>
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <Package size={16} className="mb-2 text-[#FF6B00]" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Produk Terhubung</p>
          <p className="mt-0.5 text-4xl font-extrabold text-gray-900">{stats.linkedProducts}</p>
          <p className="mt-2 text-[11px] text-gray-400">berdasarkan produk backend</p>
        </div>
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <Building2 size={16} className="mb-2 text-[#FF6B00]" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Kontak Belum Ada</p>
          <p className="mt-0.5 text-4xl font-extrabold text-gray-900">{stats.withoutContact}</p>
          <p className="mt-2 text-[11px] text-gray-400">dapat dilengkapi nanti</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari supplier atau kontak..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64 rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-300"
          />
        </div>
        <div className="flex-1" />
        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">
          {filtered.length} supplier
        </span>
      </div>

      <div className="flex items-start gap-5">
        <div className={`overflow-hidden rounded-[20px] bg-white shadow-sm ${detail ? "min-w-0 flex-1" : "w-full"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">No.</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Supplier</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Kontak</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Produk Terhubung</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Data Pembelian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier, index) => (
                <tr
                  key={supplier.id}
                  onClick={() => setDetail(supplier)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${
                    index < filtered.length - 1 ? "border-b border-gray-50" : ""
                  } ${detail?.id === supplier.id ? "bg-orange-50/40" : ""}`}
                >
                  <td className="px-5 py-3.5 text-xs font-bold text-gray-400">{String(index + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold text-white"
                        style={{ background: supplier.logoColor }}
                      >
                        {supplier.abbr}
                      </div>
                      <span className="font-semibold text-gray-800">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{supplier.contact}</td>
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{supplier.productCount}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">Belum tersedia</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm text-gray-400">Tidak ada supplier ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t border-gray-100 px-5 py-3.5 text-xs text-gray-400">
            Menampilkan {filtered.length} dari {suppliers.length} supplier
          </div>
        </div>

        {detail && (
          <div className="w-[285px] flex-shrink-0 overflow-hidden rounded-[20px] bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-bold text-gray-700">Detail Supplier</span>
              <button
                onClick={() => setDetail(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col items-center px-5 pb-4">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-extrabold text-white shadow-md"
                style={{ background: detail.logoColor }}
              >
                {detail.abbr}
              </div>
              <p className="mt-2.5 text-center text-base font-bold text-gray-900">{detail.name}</p>
              <span className="mt-1.5 rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                Data backend
              </span>
            </div>
            <div className="mx-5 border-t border-gray-100" />
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Phone size={13} className="flex-shrink-0 text-gray-400" />
                <span className="break-all text-sm font-medium text-gray-600">{detail.contact}</span>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Produk Terhubung</p>
                <p className="mt-1 text-xl font-extrabold text-gray-900">{detail.productCount}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pembelian, Hutang, Riwayat</p>
                <p className="mt-1 text-xs text-gray-400">Belum tersedia dari backend</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
