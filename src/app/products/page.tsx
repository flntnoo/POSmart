"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getStatus, toProductView, type ProductCategory, type Product as ProductView } from "@/data/products";
import { auditLogService, categoryService, inventoryService, outletService, productService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Category, Inventory, Outlet, Product } from "@/types/posmart";
import { Search, Plus, Pencil, Trash2, Package, ChevronDown, X } from "lucide-react";

type CategoryFilter = "Semua" | "Minuman" | "Makanan" | "Snack" | "Retail";
type StatusFilter = "Semua" | "Aktif" | "Menipis" | "Habis";

const categoryTabs: { key: CategoryFilter; label: string }[] = [
  { key: "Semua", label: "Semua" },
  { key: "Minuman", label: "Minuman" },
  { key: "Makanan", label: "Makanan" },
  { key: "Snack", label: "Snack" },
  { key: "Retail", label: "Retail" },
];

const statusTabs: StatusFilter[] = ["Semua", "Aktif", "Menipis", "Habis"];

const categoryColors: Record<ProductCategory, string> = {
  Minuman: "bg-orange-50 text-orange-500",
  Makanan: "bg-blue-50 text-blue-500",
  Snack: "bg-green-50 text-green-600",
  Retail: "bg-purple-50 text-purple-500",
};

const categoryGradients: Record<ProductCategory, [string, string]> = {
  Minuman: ["#FFF3E0", "#FFD9A0"],
  Makanan: ["#E3F2FD", "#BBDEFB"],
  Snack: ["#E8F5E9", "#C8E6C9"],
  Retail: ["#F3E5F5", "#E1BEE7"],
};

const statusColors: Record<string, string> = {
  Aktif:   "bg-green-50 text-green-600",
  Menipis: "bg-yellow-50 text-yellow-600",
  Habis:   "bg-red-50 text-red-500",
};

type FormData = {
  name: string;
  sku: string;
  category: ProductCategory;
  price: string;
  stock: string;
  description: string;
};

const emptyForm: FormData = {
  name: "", sku: "", category: "Minuman", price: "", stock: "", description: "",
};

function formatPrice(p: number) {
  return "Rp " + p.toLocaleString("id-ID");
}

export default function ProductsPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId ?? "user-owner-001";
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Semua");
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("Semua");
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [form, setForm]                     = useState<FormData>(emptyForm);
  const [products, setProducts]             = useState<ProductView[]>([]);
  const [domainProducts, setDomainProducts] = useState<Product[]>([]);
  const [inventory, setInventory]           = useState<Inventory[]>([]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [outlets, setOutlets]               = useState<Outlet[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      productService.list({ userId: currentUserId }),
      inventoryService.list({ userId: currentUserId }),
      categoryService.list({ userId: currentUserId }),
      outletService.list({ userId: currentUserId }),
    ]).then(([productResponse, inventoryResponse, categoryResponse, outletResponse]) => {
      if (!mounted) return;
      const nextProducts = productResponse.success && productResponse.data ? productResponse.data : [];
      const nextInventory = inventoryResponse.success && inventoryResponse.data ? inventoryResponse.data : [];
      const nextCategories = categoryResponse.success && categoryResponse.data ? categoryResponse.data : [];
      setDomainProducts(nextProducts);
      setInventory(nextInventory);
      setCategories(nextCategories);
      if (outletResponse.success && outletResponse.data) setOutlets(outletResponse.data);
      setProducts(nextProducts.map((product) => toProductView(product, nextInventory, nextCategories)));
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  const stats = useMemo(() => {
    const aktif      = products.filter(p => getStatus(p.stock, p.minStock) === "Aktif").length;
    const menipis    = products.filter(p => getStatus(p.stock, p.minStock) === "Menipis").length;
    const habis      = products.filter(p => getStatus(p.stock, p.minStock) === "Habis").length;
    const categories = new Set(products.map(p => p.category)).size;
    const totalSold  = products.reduce((s, p) => s + p.sold, 0);
    return { aktif, menipis, habis, categories, totalSold };
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== "Semua" && p.category !== categoryFilter) return false;
      if (statusFilter !== "Semua" && getStatus(p.stock, p.minStock) !== statusFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter, search]);

  function openAdd() {
    setShowForm(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openEdit(product: typeof products[0]) {
    setShowForm(true);
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      description: "",
    });
  }

  function handleDelete(id: string) {
    const product = products.find(p => p.id === id);
    void productService.remove(id).then((response) => {
      if (response.success) setProducts(prev => prev.filter(p => p.id !== id));
    });
    void auditLogService.create({
      userId: currentUserId,
      aksi: `Menghapus produk ${product?.name ?? id}`,
      module: "products",
    });
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (editingId) {
      const existingProduct = products.find(p => p.id === editingId);
      const categoryId = categories.find((category) => category.nama === form.category)?.categoryId ?? domainProducts.find((product) => product.productId === editingId)?.categoryId;
      const price = parseInt(form.price) || existingProduct?.price || 0;
      const stock = parseInt(form.stock);
      void productService.update(editingId, {
        nama: form.name || existingProduct?.name,
        sku: form.sku || existingProduct?.sku,
        harga: price,
        categoryId,
      }).then((response) => {
        if (!response.success || !response.data) return;
        const existingInventory = inventory.find((item) => item.productId === editingId);
        const inventoryUpdate = existingInventory && stock >= 0
          ? inventoryService.adjust({ productId: editingId, outletId: existingInventory.outletId, quantity: stock, type: "set" })
          : Promise.resolve(null);

        inventoryUpdate.then((inventoryResponse) => {
          const nextInventory = inventoryResponse?.success && inventoryResponse.data
            ? inventory.map((item) => item.inventoryId === inventoryResponse.data!.inventoryId ? inventoryResponse.data! : item)
            : inventory;
          setInventory(nextInventory);
          setDomainProducts((current) => current.map((item) => item.productId === editingId ? response.data! : item));
          setProducts((current) => current.map((item) => item.id === editingId ? toProductView(response.data!, nextInventory, categories) : item));
        });
      });
      void auditLogService.create({
        userId: currentUserId,
        aksi: `Memperbarui produk ${form.name || existingProduct?.name || editingId}`,
        module: "products",
      });
    } else {
      const selectedCategory = categories.find((category) => category.nama === form.category);
      const selectedOutlet = outlets[0];
      const stock = parseInt(form.stock) || 0;
      const price = parseInt(form.price) || 0;
      const newProduct = {
        id:       `p-${Date.now()}`,
        name:     form.name,
        sku:      form.sku || `SKU-${products.length + 1}`,
        category: form.category,
        stock,
        minStock: 5,
        price,
        sold:     0,
      };
      void productService.create({
        nama: newProduct.name,
        sku: newProduct.sku,
        harga: newProduct.price,
        categoryId: selectedCategory?.categoryId,
        outletId: selectedOutlet?.outletId,
      }).then((response) => {
        if (!response.success || !response.data) {
          setProducts(prev => [newProduct, ...prev]);
          return;
        }
        const inventoryCreate = selectedOutlet
          ? inventoryService.create({ productId: response.data!.productId, outletId: selectedOutlet.outletId, stok: stock })
          : Promise.resolve(null);
        inventoryCreate.then((inventoryResponse) => {
          const nextInventory = inventoryResponse?.success && inventoryResponse.data ? [inventoryResponse.data, ...inventory] : inventory;
          const nextDomainProducts = [response.data!, ...domainProducts];
          setInventory(nextInventory);
          setDomainProducts(nextDomainProducts);
          setProducts(nextDomainProducts.map((product) => toProductView(product, nextInventory, categories)));
        });
      });
      void auditLogService.create({
        userId: currentUserId,
        aksi: `Membuat produk ${newProduct.name}`,
        module: "products",
      });
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produk &amp; Inventori</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola produk, stok, dan harga</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk atau SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-300 sm:w-64"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 — blue gradient */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(135deg, #4B7BF5 0%, #82B3FF 100%)" }}
        >
          <div className="pointer-events-none absolute -right-7 -top-7 h-36 w-36 rounded-full border-2 border-white/20" />
          <div className="pointer-events-none absolute -right-1 -top-1 h-20 w-20 rounded-full border-2 border-white/20" />

          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">Total Produk</p>
          <p className="mt-1 text-5xl font-extrabold text-white">{products.length}</p>

          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Kategori</p>
              <p className="mt-0.5 text-lg font-bold text-white">{stats.categories}</p>
            </div>
            <div className="h-8 w-px bg-white/25" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Aktif</p>
              <p className="mt-0.5 text-lg font-bold text-white">{stats.aktif}</p>
            </div>
          </div>
        </div>

        {/* Card 2 — Stok Menipis */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Stok Menipis</p>
          <p className="mt-1 text-4xl font-extrabold text-[#FF6B00]">
            {stats.menipis}
            <span className="ml-1.5 text-xl font-bold">Item.</span>
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Habis</span>
              <span className="text-xs font-semibold text-red-500">{stats.habis} produk</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Min. Stok</span>
              <span className="text-xs font-semibold text-gray-600">10 unit</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bulan Ini</span>
              <span className="text-xs font-semibold text-green-600">+234</span>
            </div>
          </div>
        </div>

        {/* Card 3 — Total Terjual */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Terjual</p>
          <p className="mt-1 text-4xl font-extrabold text-gray-900">
            {stats.totalSold.toLocaleString("id-ID")}
          </p>
          <p className="mt-3 text-xs text-gray-400">unit terjual keseluruhan</p>
        </div>

        {/* Card 4 — Stok Keluar Hari Ini */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Stok Keluar Hari Ini</p>
          <p className="mt-1 text-4xl font-extrabold text-gray-900">
            4 <span className="text-xl font-bold">Unit</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tren</span>
            <span className="rounded-lg bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">+2%</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">dibanding kemarin</p>
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                categoryFilter === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden flex-1 xl:block" />

        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1">
          {statusTabs.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                statusFilter === s
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">
          {filtered.length} produk
        </span>
      </div>

      {/* Content: table + optional inline form panel */}
      <div className="flex items-start gap-5">
        {/* Table card */}
        <div className={`overflow-hidden rounded-[20px] bg-white shadow-sm ${showForm ? "flex-1 min-w-0" : "w-full"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Produk</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Kategori</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Stok</th>
                {!showForm && (
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Harga</th>
                )}
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => {
                const status = getStatus(product.stock, product.minStock);
                const [gFrom, gTo] = categoryGradients[product.category];
                return (
                  <tr
                    key={product.id}
                    className={`transition-colors hover:bg-gray-50/60 ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-gray-600"
                          style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                        >
                          {product.sku.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight text-gray-800">{product.name}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${categoryColors[product.category]}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-semibold ${
                        product.stock === 0 ? "text-red-500" : product.stock <= product.minStock ? "text-yellow-600" : "text-gray-800"
                      }`}>
                        {product.stock}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">unit</span>
                    </td>
                    {!showForm && (
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        {formatPrice(product.price)}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={showForm ? 5 : 6} className="py-14 text-center text-sm text-gray-400">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-400">
              Menampilkan {filtered.length} dari {products.length} produk
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(page => (
                <button
                  key={page}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === 1 ? "bg-[#FF6B00] text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inline form panel */}
        {showForm && (
          <div className="w-[340px] flex-shrink-0 overflow-hidden rounded-[20px] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">{editingId ? "Edit Produk" : "Tambah Produk Baru"}</h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {/* Upload circle */}
              <div className="flex flex-col items-center pb-1">
                <button type="button" className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B00]">
                    <Package size={30} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-md">
                    <Plus size={12} className="text-white" strokeWidth={3} />
                  </div>
                </button>
                <p className="mt-2 text-xs text-gray-400">Klik untuk upload foto produk</p>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Contoh, SF Classic Cap"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-orange-300"
                />
              </div>

              {/* SKU + Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Kode SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SF-001"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Kategori</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-300"
                    >
                      <option value="Minuman">Minuman</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Snack">Snack</option>
                      <option value="Retail">Retail</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Harga + Stok */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Harga Jual</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Stok Awal</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Deskripsi (opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat produk..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-orange-300"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]"
              >
                <Plus size={16} strokeWidth={2.5} />
                {editingId ? "Simpan Perubahan" : "Simpan Produk"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="block w-full text-center text-sm font-semibold text-gray-400 transition-colors hover:text-gray-600"
              >
                Batal
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
