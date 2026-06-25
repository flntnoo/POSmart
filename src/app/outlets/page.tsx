"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { outletService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Outlet } from "@/types/posmart";
import { CheckCircle2, Pencil, Plus, Store, Trash2, X } from "lucide-react";

type OutletForm = {
  nama: string;
  alamat: string;
};

const emptyForm: OutletForm = { nama: "", alamat: "" };

export default function OutletsPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<OutletForm>(emptyForm);
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [validation, setValidation] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    outletService.list({ userId: currentUserId }).then((response) => {
      if (!mounted) return;
      if (response.success && response.data) {
        setOutlets(response.data);
        setActiveOutletId(response.data[0]?.outletId ?? "");
      } else {
        setError(response.message);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setValidation({});
  }

  function openEdit(outlet: Outlet) {
    setEditing(outlet);
    setForm({ nama: outlet.nama, alamat: outlet.alamat ?? "" });
    setValidation({});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.nama.trim()) {
      setValidation({ nama: "Nama outlet wajib diisi" });
      return;
    }

    if (editing) {
      const response = await outletService.update(editing.outletId, form);
      if (response.success && response.data) {
        setOutlets((prev) => prev.map((item) => item.outletId === editing.outletId ? response.data! : item));
        setSuccess("Outlet berhasil diperbarui.");
        setEditing(null);
        setForm(emptyForm);
      } else {
        setValidation(response.errors ?? { form: response.message });
      }
      return;
    }

    const response = await outletService.create({ userId: currentUserId, nama: form.nama, alamat: form.alamat });
    if (response.success && response.data) {
      setOutlets((prev) => prev.some((item) => item.outletId === response.data!.outletId) ? [...prev] : [response.data!, ...prev]);
      setActiveOutletId((current) => current || response.data!.outletId);
      setSuccess("Outlet berhasil ditambahkan.");
      setForm(emptyForm);
    } else {
      setValidation(response.errors ?? { form: response.message });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const response = await outletService.remove(deleteTarget.outletId);
    if (!response.success) {
      setValidation(response.errors ?? { form: response.message });
      setDeleteTarget(null);
      return;
    }
    setOutlets((prev) => prev.filter((item) => item.outletId !== deleteTarget.outletId));
    if (activeOutletId === deleteTarget.outletId) {
      const nextOutlet = outlets.find((item) => item.outletId !== deleteTarget.outletId);
      setActiveOutletId(nextOutlet?.outletId ?? "");
    }
    setSuccess("Outlet berhasil dihapus.");
    setDeleteTarget(null);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Outlet</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola cabang atau lokasi usaha Anda</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E05E00]">
          <Plus size={16} />
          Tambah Outlet
        </button>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto text-green-500"><X size={14} /></button>
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState title="Gagal memuat outlet" description={error} /> : (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 overflow-hidden rounded-[20px] bg-white shadow-sm">
            {outlets.length === 0 ? (
              <EmptyState title="Belum ada outlet" description="Tambahkan outlet pertama untuk mulai menghubungkan produk dan transaksi." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Outlet</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Alamat</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet) => (
                    <tr key={outlet.outletId} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
                            <Store size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{outlet.nama}</p>
                            <p className="text-xs text-gray-400">{outlet.outletId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">{outlet.alamat || "-"}</td>
                      <td className="px-4 py-4">
                        {activeOutletId === outlet.outletId ? (
                          <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">Aktif</span>
                        ) : (
                          <button onClick={() => setActiveOutletId(outlet.outletId)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-orange-50 hover:text-orange-500">
                            Jadikan aktif
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => openEdit(outlet)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(outlet)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="col-span-4 rounded-[20px] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{editing ? "Edit Outlet" : "Tambah Outlet"}</h2>
            <p className="mt-1 text-sm text-gray-400">Data ini akan dipakai untuk transaksi dan inventory.</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama outlet</label>
                <input value={form.nama} onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black caret-black placeholder:text-gray-400 outline-none focus:border-orange-300" placeholder="Contoh: Kedai Kopi Senja" />
                {validation.nama && <p className="mt-1 text-xs font-semibold text-red-500">{validation.nama}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Alamat</label>
                <textarea value={form.alamat} onChange={(event) => setForm((prev) => ({ ...prev, alamat: event.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black caret-black placeholder:text-gray-400 outline-none focus:border-orange-300" placeholder="Alamat outlet" />
              </div>
              {validation.form && <p className="text-xs font-semibold text-red-500">{validation.form}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white hover:bg-[#E05E00]">
                {editing ? "Simpan Perubahan" : "Simpan Outlet"}
              </button>
              {editing && <button type="button" onClick={openAdd} className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600">Batal edit</button>}
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus outlet?"
        description={`Outlet ${deleteTarget?.nama ?? ""} akan dihapus dari backend jika tidak memiliki transaksi terkait.`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
