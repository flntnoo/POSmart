"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  getStatus,
  toProductView,
  type KnownProductCategory,
  type ProductCategory,
  type Product as ProductView,
} from "@/data/products";
import { categoryService, inventoryService, outletService, productService, supplierService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Category, Inventory, Outlet, Product, Supplier } from "@/types/posmart";
import { AlertTriangle, CheckCircle2, ChevronDown, ImagePlus, Loader2, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";

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
  "Belum tersedia": "bg-gray-100 text-gray-500",
};

const categoryGradients: Record<ProductCategory, [string, string]> = {
  Minuman: ["#FFF3E0", "#FFD9A0"],
  Makanan: ["#E3F2FD", "#BBDEFB"],
  Snack: ["#E8F5E9", "#C8E6C9"],
  Retail: ["#F3E5F5", "#E1BEE7"],
  "Belum tersedia": ["#F3F4F6", "#E5E7EB"],
};

const statusColors: Record<string, string> = {
  Aktif:   "bg-green-50 text-green-600",
  Menipis: "bg-yellow-50 text-yellow-600",
  Habis:   "bg-red-50 text-red-500",
  "Belum tersedia": "bg-gray-100 text-gray-500",
};

type FormData = {
  name: string;
  sku: string;
  category: KnownProductCategory | "";
  price: string;
  stock: string;
  description: string;
  photoDataUrl: string;
};

const emptyForm: FormData = {
  name: "", sku: "", category: "", price: "", stock: "", description: "", photoDataUrl: "",
};

type FormErrors = Partial<Record<keyof FormData | "form" | "outlet", string>>;

function formatPrice(p: number) {
  return "Rp " + p.toLocaleString("id-ID");
}

const productPhotoStorageKey = "posmart.productPhotos.v1";

function loadStoredProductPhotos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(productPhotoStorageKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, string>
      : {};
  } catch {
    return {};
  }
}

function storeProductPhotos(photos: Record<string, string>) {
  try {
    window.localStorage.setItem(productPhotoStorageKey, JSON.stringify(photos));
  } catch {
    // Browser storage can be full or blocked; the preview still works for this session.
  }
}

export default function ProductsPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
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
  const [suppliers, setSuppliers]           = useState<Supplier[]>([]);
  const [productPhotos, setProductPhotos]   = useState<Record<string, string>>({});
  const [formErrors, setFormErrors]         = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => setProductPhotos(loadStoredProductPhotos()));
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      productService.list({ userId: currentUserId }),
      inventoryService.list({ userId: currentUserId }),
      categoryService.list({ userId: currentUserId }),
      outletService.list({ userId: currentUserId }),
      supplierService.list({ userId: currentUserId }),
    ]).then(([productResponse, inventoryResponse, categoryResponse, outletResponse, supplierResponse]) => {
      if (!mounted) return;
      const nextProducts = productResponse.success && productResponse.data ? productResponse.data : [];
      const nextInventory = inventoryResponse.success && inventoryResponse.data ? inventoryResponse.data : [];
      const nextCategories = categoryResponse.success && categoryResponse.data ? categoryResponse.data : [];
      const nextOutlets = outletResponse.success && outletResponse.data ? outletResponse.data : [];
      const nextSuppliers = supplierResponse.success && supplierResponse.data ? supplierResponse.data : [];
      setDomainProducts(nextProducts);
      setInventory(nextInventory);
      setCategories(nextCategories);
      setOutlets(nextOutlets);
      setSuppliers(nextSuppliers);
      setProducts(nextProducts.map((product) => toProductView(product, {
        inventory: nextInventory,
        categories: nextCategories,
        suppliers: nextSuppliers,
        outlets: nextOutlets,
      })));
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
    const totalStock = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    const recordedMinimums = products.flatMap((product) => product.minStock === null ? [] : [product.minStock]);
    const minimumStock = recordedMinimums.length > 0 ? Math.min(...recordedMinimums) : null;
    return { aktif, menipis, habis, categories, totalStock, minimumStock };
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
    setFormErrors({});
  }

  function openEdit(product: typeof products[0]) {
    setShowForm(true);
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category === "Belum tersedia" ? "" : product.category,
      price: String(product.price),
      stock: product.stock === null ? "" : String(product.stock),
      description: "",
      photoDataUrl: productPhotos[product.id] ?? "",
    });
    setFormErrors({});
  }

  function saveProductPhoto(productId: string, photoDataUrl: string) {
    setProductPhotos((current) => {
      const next = { ...current };
      if (photoDataUrl) {
        next[productId] = photoDataUrl;
      } else {
        delete next[productId];
      }
      storeProductPhotos(next);
      return next;
    });
  }

  function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormErrors((current) => ({ ...current, form: "File foto harus berupa gambar." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors((current) => ({ ...current, form: "Ukuran foto maksimal 2 MB." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, photoDataUrl: result }));
      setFormErrors((current) => {
        const next = { ...current };
        delete next.form;
        return next;
      });
    };
    reader.onerror = () => {
      setFormErrors((current) => ({ ...current, form: "Foto gagal dibaca. Coba pilih file lain." }));
    };
    reader.readAsDataURL(file);
  }

  function handleDelete(id: string) {
    void productService.remove(id).then((response) => {
      if (response.success) setProducts(prev => prev.filter(p => p.id !== id));
    });
  }

  function apiErrors(errors: Record<string, string> | undefined, fallback: string): FormErrors {
    return {
      ...(errors?.nama ? { name: errors.nama } : {}),
      ...(errors?.sku ? { sku: errors.sku } : {}),
      ...(errors?.categoryId ? { category: errors.categoryId } : {}),
      ...(errors?.harga ? { price: errors.harga } : {}),
      ...(errors?.outletId ? { outlet: errors.outletId } : {}),
      form: errors?.request ?? fallback,
    };
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock || 0);
    const validation: FormErrors = {};

    if (!form.name.trim()) validation.name = "Nama produk wajib diisi";
    if (form.price === "" || !Number.isFinite(price) || price < 0) validation.price = "Harga harus berupa angka 0 atau lebih";
    if (!Number.isInteger(stock) || stock < 0) validation.stock = "Stok harus berupa bilangan bulat 0 atau lebih";
    if (!editingId && outlets.length === 0) validation.outlet = "Belum ada outlet. Tambahkan outlet terlebih dahulu sebelum membuat produk.";

    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }

    setFormErrors({});
    setSuccessMessage("");
    setIsSubmitting(true);

    if (editingId) {
      const existingProduct = products.find(p => p.id === editingId);
      const categoryId = categories.find((category) => category.nama === form.category)?.categoryId ?? domainProducts.find((product) => product.productId === editingId)?.categoryId;
      const response = await productService.update(editingId, {
        nama: form.name.trim() || existingProduct?.name,
        sku: form.sku.trim() || existingProduct?.sku,
        harga: price,
        categoryId,
      });

      if (!response.success || !response.data) {
        setFormErrors(apiErrors(response.errors, response.message));
        setIsSubmitting(false);
        return;
      }

      const existingInventory = inventory.find((item) => item.productId === editingId);
      const inventoryResponse = existingInventory
        ? await inventoryService.adjust({ productId: editingId, outletId: existingInventory.outletId, quantity: stock, type: "set" })
        : null;

      if (inventoryResponse && (!inventoryResponse.success || !inventoryResponse.data)) {
        setFormErrors({ form: `Data produk tersimpan, tetapi stok gagal diperbarui: ${inventoryResponse.message}` });
        setIsSubmitting(false);
        return;
      }

      const nextInventory = inventoryResponse?.data
        ? inventory.map((item) => item.inventoryId === inventoryResponse.data!.inventoryId ? inventoryResponse.data! : item)
        : inventory;
      setInventory(nextInventory);
      saveProductPhoto(editingId, form.photoDataUrl);
      setDomainProducts((current) => current.map((item) => item.productId === editingId ? response.data! : item));
      setProducts((current) => current.map((item) => item.id === editingId ? toProductView(response.data!, {
        inventory: nextInventory,
        categories,
        suppliers,
        outlets,
      }) : item));
      setSuccessMessage("Produk berhasil diperbarui.");
    } else {
      const selectedCategory = categories.find((category) => category.nama === form.category);
      const selectedOutlet = outlets[0];
      const response = await productService.create({
        nama: form.name.trim(),
        sku: form.sku.trim() || undefined,
        harga: price,
        categoryId: selectedCategory?.categoryId,
        outletId: selectedOutlet?.outletId,
      });

      if (!response.success || !response.data) {
        setFormErrors(apiErrors(response.errors, response.message));
        setIsSubmitting(false);
        return;
      }

      const inventoryResponse = await inventoryService.create({
        productId: response.data.productId,
        outletId: selectedOutlet.outletId,
        stok: stock,
      });
      const nextInventory = inventoryResponse.success && inventoryResponse.data ? [inventoryResponse.data, ...inventory] : inventory;
      const nextDomainProducts = [response.data, ...domainProducts];
      setInventory(nextInventory);
      saveProductPhoto(response.data.productId, form.photoDataUrl);
      setDomainProducts(nextDomainProducts);
      setProducts(nextDomainProducts.map((product) => toProductView(product, {
        inventory: nextInventory,
        categories,
        suppliers,
        outlets,
      })));
      setSuccessMessage(inventoryResponse.success
        ? "Produk berhasil ditambahkan."
        : `Produk berhasil ditambahkan, tetapi stok awal gagal disimpan: ${inventoryResponse.message}`);
    }

    setIsSubmitting(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  return (
    <DashboardLayout>
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {successMessage}
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-green-500"><X size={14} /></button>
        </div>
      )}
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
              <span className="text-xs font-semibold text-gray-600">
                {stats.minimumStock === null ? "Belum tersedia" : `${stats.minimumStock} unit`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              <span className="text-xs font-semibold text-gray-600">Data backend</span>
            </div>
          </div>
        </div>

        {/* Card 3 — Total Terjual */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Stok Tercatat</p>
          <p className="mt-1 text-4xl font-extrabold text-gray-900">
            {stats.totalStock.toLocaleString("id-ID")}
          </p>
          <p className="mt-3 text-xs text-gray-400">unit dari inventory backend</p>
        </div>

        {/* Card 4 — Stok Keluar Hari Ini */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Stok Aman</p>
          <p className="mt-1 text-4xl font-extrabold text-gray-900">
            {stats.aktif} <span className="text-xl font-bold">Produk</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sumber</span>
            <span className="rounded-lg bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">Live</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">berdasarkan stok minimum</p>
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
                        {productPhotos[product.id] ? (
                          <div
                            role="img"
                            aria-label={product.name}
                            className="h-10 w-10 flex-shrink-0 rounded-xl bg-cover bg-center"
                            style={{ backgroundImage: `url(${productPhotos[product.id]})` }}
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-gray-600"
                            style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                          >
                            {product.sku === "-" ? "PR" : product.sku.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight text-gray-800">{product.name}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{product.sku}</p>
                          <p className="mt-0.5 truncate text-[10px] text-gray-400">
                            {product.supplier} • {product.outlet}
                          </p>
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
                        product.stock === null
                          ? "text-gray-400"
                          : product.stock === 0
                            ? "text-red-500"
                            : product.minStock !== null && product.stock <= product.minStock
                              ? "text-yellow-600"
                              : "text-gray-800"
                      }`}>
                        {product.stock ?? "-"}
                      </span>
                      {product.stock !== null && <span className="ml-1 text-xs text-gray-400">unit</span>}
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
              {(formErrors.form || formErrors.outlet) && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-red-600">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <span>{formErrors.outlet ?? formErrors.form}</span>
                </div>
              )}
              {/* Upload circle */}
              <div className="flex flex-col items-center pb-1">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => handlePhotoChange(event.target.files?.[0])}
                  />
                  {form.photoDataUrl ? (
                    <div
                      role="img"
                      aria-label="Preview foto produk"
                      className="h-20 w-20 rounded-full bg-cover bg-center ring-4 ring-orange-50"
                      style={{ backgroundImage: `url(${form.photoDataUrl})` }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B00]">
                      <Package size={30} className="text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-md">
                    <ImagePlus size={12} className="text-white" strokeWidth={3} />
                  </div>
                </label>
                {form.photoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, photoDataUrl: "" }))}
                    className="mt-2 text-[11px] font-semibold text-gray-400 hover:text-red-500"
                  >
                    Hapus foto
                  </button>
                )}
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
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
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
                  {formErrors.sku && <p className="mt-1 text-xs text-red-500">{formErrors.sku}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Kategori</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value as KnownProductCategory | "" }))}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-300"
                    >
                      <option value="">Belum tersedia</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Snack">Snack</option>
                      <option value="Retail">Retail</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {formErrors.category && <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>}
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
                  {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
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
                  {formErrors.stock && <p className="mt-1 text-xs text-red-500">{formErrors.stock}</p>}
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
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Produk"}
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
