"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { categoryService, productService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Category, Product } from "@/types/posmart";
import { CheckCircle2, FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";

export default function CategoriesPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [validation, setValidation] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([categoryService.list({ userId: currentUserId }), productService.list({ userId: currentUserId })]).then(([categoryResponse, productResponse]) => {
      if (!mounted) return;
      if (categoryResponse.success && categoryResponse.data) setCategories(categoryResponse.data);
      else setError(categoryResponse.message);
      if (productResponse.success && productResponse.data) setProducts(productResponse.data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  function usedCount(categoryId: string) {
    return products.filter((product) => product.categoryId === categoryId).length;
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.nama);
    setValidation("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setValidation("Nama kategori wajib diisi");
      return;
    }
    if (editing) {
      const response = await categoryService.update(editing.categoryId, { nama: name.trim() });
      if (response.success && response.data) {
        setCategories((prev) => prev.map((item) => item.categoryId === editing.categoryId ? response.data! : item));
        setSuccess("Kategori berhasil diperbarui.");
        setEditing(null);
        setName("");
      } else {
        setValidation(response.errors?.nama ?? response.message);
      }
      return;
    }

    const response = await categoryService.create({ nama: name.trim(), userId: currentUserId });
    if (response.success && response.data) {
      setCategories((prev) => prev.some((item) => item.categoryId === response.data!.categoryId) ? [...prev] : [response.data!, ...prev]);
      setSuccess("Kategori berhasil ditambahkan.");
      setName("");
    } else {
      setValidation(response.errors?.nama ?? response.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (usedCount(deleteTarget.categoryId) > 0) {
      setValidation("Kategori masih digunakan produk. Pindahkan produk sebelum menghapus kategori.");
      setDeleteTarget(null);
      return;
    }
    const response = await categoryService.remove(deleteTarget.categoryId);
    if (!response.success) {
      setValidation(response.errors?.categoryId ?? response.message);
      setDeleteTarget(null);
      return;
    }
    setCategories((prev) => prev.filter((item) => item.categoryId !== deleteTarget.categoryId));
    setSuccess("Kategori berhasil dihapus.");
    setDeleteTarget(null);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategori Produk</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola pengelompokan produk POSmart</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto text-green-500"><X size={14} /></button>
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState title="Gagal memuat kategori" description={error} /> : (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 overflow-hidden rounded-[20px] bg-white shadow-sm">
            {categories.length === 0 ? (
              <EmptyState title="Belum ada kategori" description="Tambahkan kategori agar produk lebih mudah dikelola." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Kategori</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Produk Terkait</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.categoryId} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
                            <FolderTree size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{category.nama}</p>
                            <p className="text-xs text-gray-400">{category.categoryId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{usedCount(category.categoryId)} produk</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => openEdit(category)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(category)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="col-span-4 rounded-[20px] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{editing ? "Edit Kategori" : "Tambah Kategori"}</h2>
            <p className="mt-1 text-sm text-gray-400">Nama kategori wajib diisi.</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama kategori</label>
                <input value={name} onChange={(event) => { setName(event.target.value); setValidation(""); }} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-300" placeholder="Contoh: Minuman" />
                {validation && <p className="mt-1 text-xs font-semibold text-red-500">{validation}</p>}
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white hover:bg-[#E05E00]">
                <Plus size={16} />
                {editing ? "Simpan Perubahan" : "Simpan Kategori"}
              </button>
              {editing && <button type="button" onClick={() => { setEditing(null); setName(""); setValidation(""); }} className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600">Batal edit</button>}
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={usedCount(deleteTarget?.categoryId ?? "") > 0 ? "Kategori masih digunakan" : "Hapus kategori?"}
        description={usedCount(deleteTarget?.categoryId ?? "") > 0 ? "Kategori ini masih dipakai produk. Sistem akan menolak penghapusan untuk menjaga relasi data." : `Kategori ${deleteTarget?.nama ?? ""} akan dihapus dari backend.`}
        confirmLabel={usedCount(deleteTarget?.categoryId ?? "") > 0 ? "Saya mengerti" : "Hapus"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
