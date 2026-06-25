"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { inventoryService, outletService, productService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Inventory, Outlet, Product } from "@/types/posmart";
import { AlertTriangle, Boxes, CheckCircle2, Search, X } from "lucide-react";

type AdjustmentType = "in" | "out" | "set";

type AdjustmentForm = {
  productId: string;
  outletId: string;
  type: AdjustmentType;
  quantity: string;
};

const emptyForm: AdjustmentForm = {
  productId: "",
  outletId: "",
  type: "in",
  quantity: "",
};

export default function InventoryPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [outletFilter, setOutletFilter] = useState("all");
  const [form, setForm] = useState<AdjustmentForm>(emptyForm);
  const [validation, setValidation] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      inventoryService.list({ userId: currentUserId }),
      productService.list({ userId: currentUserId }),
      outletService.list({ userId: currentUserId }),
    ]).then(([inventoryResponse, productResponse, outletResponse]) => {
      if (!mounted) return;
      if (inventoryResponse.success && inventoryResponse.data) setInventory(inventoryResponse.data);
      else setError(inventoryResponse.message);
      if (productResponse.success && productResponse.data) setProducts(productResponse.data);
      if (outletResponse.success && outletResponse.data) setOutlets(outletResponse.data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  const productById = useMemo(() => new Map(products.map((product) => [product.productId, product])), [products]);
  const outletById = useMemo(() => new Map(outlets.map((outlet) => [outlet.outletId, outlet])), [outlets]);

  const filteredInventory = useMemo(() => {
    const q = search.toLowerCase();
    return inventory.filter((item) => {
      const product = productById.get(item.productId);
      if (outletFilter !== "all" && item.outletId !== outletFilter) return false;
      if (q && !product?.nama.toLowerCase().includes(q) && !product?.sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inventory, outletFilter, productById, search]);

  function currentStock(productId: string, outletId: string) {
    return inventory.find((item) => item.productId === productId && item.outletId === outletId)?.stok ?? 0;
  }

  async function handleAdjust(event: React.FormEvent) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const nextValidation: Record<string, string> = {};

    if (!form.productId || !productById.has(form.productId)) nextValidation.productId = "Produk wajib dipilih";
    if (!form.outletId || !outletById.has(form.outletId)) nextValidation.outletId = "Outlet wajib dipilih";
    if (!form.quantity || Number.isNaN(quantity)) nextValidation.quantity = "Jumlah stok wajib diisi";
    if (quantity < 0) nextValidation.quantity = "Stok tidak boleh negatif";
    if (form.type !== "set" && quantity <= 0) nextValidation.quantity = "Jumlah stok harus lebih dari 0";
    if (form.type === "out" && quantity > currentStock(form.productId, form.outletId)) {
      nextValidation.quantity = "Stok keluar tidak boleh melebihi stok tersedia";
    }

    setValidation(nextValidation);
    if (Object.keys(nextValidation).length > 0) return;

    const response = await inventoryService.adjust({
      productId: form.productId,
      outletId: form.outletId,
      type: form.type,
      quantity,
    });

    if (response.success && response.data) {
      setInventory((prev) => prev.map((item) => item.inventoryId === response.data!.inventoryId ? response.data! : item));
      setSuccess("Stok berhasil disesuaikan.");
      setForm(emptyForm);
    } else {
      setValidation(response.errors ?? { form: response.message });
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-0.5 text-sm text-gray-500">Pantau dan sesuaikan stok produk per outlet</p>
        </div>
        <span className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-500">
          {inventory.filter((item) => item.stok <= item.minStock).length} stok menipis
        </span>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto text-green-500"><X size={14} /></button>
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState title="Gagal memuat inventory" description={error} /> : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-300" placeholder="Cari produk atau SKU..." />
              </div>
              <select value={outletFilter} onChange={(event) => setOutletFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none">
                <option value="all">Semua outlet</option>
                {outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.nama}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto rounded-[20px] bg-white shadow-sm">
              {filteredInventory.length === 0 ? (
                <EmptyState title="Inventory tidak ditemukan" description="Coba ubah outlet atau kata kunci pencarian." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Produk</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Outlet</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Stok</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const product = productById.get(item.productId);
                      const isLow = item.stok <= item.minStock;
                      return (
                        <tr key={item.inventoryId} className="border-b border-gray-50 hover:bg-gray-50/60">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Boxes size={18} /></div>
                              <div>
                                <p className="font-semibold text-gray-800">{product?.nama ?? "Produk tidak dikenal"}</p>
                                <p className="text-xs text-gray-400">{product?.sku ?? item.productId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-500">{outletById.get(item.outletId)?.nama ?? item.outletId}</td>
                          <td className="px-4 py-4 font-bold text-gray-900">{item.stok} <span className="text-xs font-normal text-gray-400">unit</span></td>
                          <td className="px-4 py-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500"><AlertTriangle size={12} /> Menipis</span>
                            ) : (
                              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">Aman</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-6 shadow-sm xl:col-span-4">
            <h2 className="text-base font-bold text-gray-900">Penyesuaian Stok</h2>
            <p className="mt-1 text-sm text-gray-400">Tambah, kurangi, atau set stok produk.</p>
            <form onSubmit={handleAdjust} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Produk</label>
                <select value={form.productId} onChange={(event) => setForm((prev) => ({ ...prev, productId: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300">
                  <option value="">Pilih produk</option>
                  {products.map((product) => <option key={product.productId} value={product.productId}>{product.nama}</option>)}
                </select>
                {validation.productId && <p className="mt-1 text-xs font-semibold text-red-500">{validation.productId}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Outlet</label>
                <select value={form.outletId} onChange={(event) => setForm((prev) => ({ ...prev, outletId: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300">
                  <option value="">Pilih outlet</option>
                  {outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.nama}</option>)}
                </select>
                {validation.outletId && <p className="mt-1 text-xs font-semibold text-red-500">{validation.outletId}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Jenis penyesuaian</label>
                <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as AdjustmentType }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300">
                  <option value="in">Tambah stok</option>
                  <option value="out">Kurangi stok</option>
                  <option value="set">Set stok</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Jumlah</label>
                <input type="number" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-300" placeholder="0" />
                {validation.quantity && <p className="mt-1 text-xs font-semibold text-red-500">{validation.quantity}</p>}
              </div>
              {form.productId && form.outletId && (
                <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Stok saat ini: <span className="font-bold text-gray-900">{currentStock(form.productId, form.outletId)} unit</span>
                </div>
              )}
              {validation.form && <p className="text-xs font-semibold text-red-500">{validation.form}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white hover:bg-[#E05E00]">Simpan Penyesuaian</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
