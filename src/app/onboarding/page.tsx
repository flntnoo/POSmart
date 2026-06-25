"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ErrorState, LoadingState } from "@/components/ui/AppState";
import {
  categoryService,
  inventoryService,
  outletService,
  productService,
  supplierService,
} from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Category, Inventory, Outlet, Product, Supplier } from "@/types/posmart";
import { CheckCircle2, ChevronLeft, ChevronRight, PackagePlus, Store } from "lucide-react";

type StepKey = "outlet" | "category" | "supplier" | "product" | "inventory";

type Step = {
  key: StepKey;
  title: string;
  required: boolean;
};

const steps: Step[] = [
  { key: "outlet", title: "Outlet", required: true },
  { key: "category", title: "Kategori", required: true },
  { key: "supplier", title: "Supplier", required: false },
  { key: "product", title: "Produk", required: true },
  { key: "inventory", title: "Stok Awal", required: true },
];

type OutletForm = { mode: "select" | "create"; outletId: string; nama: string; alamat: string };
type CategoryForm = { mode: "select" | "create"; categoryId: string; nama: string };
type SupplierForm = { enabled: boolean; supplierId: string; nama: string; kontak: string };
type ProductForm = { nama: string; harga: string; categoryId: string; supplierId: string; outletId: string };
type InventoryForm = { productId: string; outletId: string; stok: string };

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId;
  const [stepIndex, setStepIndex] = useState(0);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validation, setValidation] = useState<Record<string, string>>({});

  const [outletForm, setOutletForm] = useState<OutletForm>({ mode: "create", outletId: "", nama: "", alamat: "" });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ mode: "create", categoryId: "", nama: "" });
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({ enabled: false, supplierId: "", nama: "", kontak: "" });
  const [productForm, setProductForm] = useState<ProductForm>({ nama: "", harga: "", categoryId: "", supplierId: "", outletId: "" });
  const [inventoryForm, setInventoryForm] = useState<InventoryForm>({ productId: "", outletId: "", stok: "" });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [outletResponse, categoryResponse, supplierResponse, productResponse, inventoryResponse] = await Promise.all([
        outletService.list({ userId: currentUserId }),
        categoryService.list({ userId: currentUserId }),
        supplierService.list({ userId: currentUserId }),
        productService.list({ userId: currentUserId }),
        inventoryService.list({ userId: currentUserId }),
      ]);

      if (!mounted) return;

      const nextOutlets = outletResponse.success && outletResponse.data ? outletResponse.data : [];
      const nextCategories = categoryResponse.success && categoryResponse.data ? categoryResponse.data : [];
      const nextSuppliers = supplierResponse.success && supplierResponse.data ? supplierResponse.data : [];
      const nextProducts = productResponse.success && productResponse.data ? productResponse.data : [];
      const nextInventory = inventoryResponse.success && inventoryResponse.data ? inventoryResponse.data : [];

      setOutlets(nextOutlets);
      setCategories(nextCategories);
      setSuppliers(nextSuppliers);
      setProducts(nextProducts);
      setInventory(nextInventory);
      if (nextOutlets[0]) {
        setOutletForm((current) => current.outletId ? current : { ...current, outletId: nextOutlets[0].outletId });
        setProductForm((current) => current.outletId ? current : { ...current, outletId: nextOutlets[0].outletId });
        setInventoryForm((current) => current.outletId ? current : { ...current, outletId: nextOutlets[0].outletId });
      }
      if (nextCategories[0]) {
        setCategoryForm((current) => current.categoryId ? current : { ...current, categoryId: nextCategories[0].categoryId });
        setProductForm((current) => current.categoryId ? current : { ...current, categoryId: nextCategories[0].categoryId });
      }
      if (nextProducts[0]) {
        setInventoryForm((current) => current.productId ? current : { ...current, productId: nextProducts[0].productId });
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  const currentStep = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const selectedSupplier = useMemo(() => suppliers.find((supplier) => supplier.supplierId === supplierForm.supplierId), [supplierForm.supplierId, suppliers]);

  function resetMessages() {
    setError("");
    setSuccess("");
    setValidation({});
  }

  async function saveOutlet() {
    resetMessages();
    if (outletForm.mode === "select") {
      if (!outletForm.outletId) {
        setValidation({ outletId: "Pilih outlet atau buat outlet baru" });
        return false;
      }
      setProductForm((current) => ({ ...current, outletId: outletForm.outletId }));
      setInventoryForm((current) => ({ ...current, outletId: outletForm.outletId }));
      return true;
    }

    if (!outletForm.nama.trim()) {
      setValidation({ nama: "Nama outlet wajib diisi" });
      return false;
    }

    const response = await outletService.create({
      userId: currentUserId,
      nama: outletForm.nama.trim(),
      alamat: outletForm.alamat.trim(),
    });

    if (!response.success || !response.data) {
      setValidation(response.errors ?? { form: response.message });
      return false;
    }

    const outlet = response.data;
    setOutlets((current) => current.some((item) => item.outletId === outlet.outletId) ? [...current] : [outlet, ...current]);
    setOutletForm((current) => ({ ...current, outletId: outlet.outletId }));
    setProductForm((current) => ({ ...current, outletId: outlet.outletId }));
    setInventoryForm((current) => ({ ...current, outletId: outlet.outletId }));
    setSuccess("Outlet berhasil disiapkan.");
    return true;
  }

  async function saveCategory() {
    resetMessages();
    if (categoryForm.mode === "select") {
      if (!categoryForm.categoryId) {
        setValidation({ categoryId: "Pilih kategori atau buat kategori baru" });
        return false;
      }
      setProductForm((current) => ({ ...current, categoryId: categoryForm.categoryId }));
      return true;
    }

    if (!categoryForm.nama.trim()) {
      setValidation({ nama: "Nama kategori wajib diisi" });
      return false;
    }

    const response = await categoryService.create({ nama: categoryForm.nama.trim(), userId: currentUserId });
    if (!response.success || !response.data) {
      setValidation(response.errors ?? { form: response.message });
      return false;
    }

    const category = response.data;
    setCategories((current) => current.some((item) => item.categoryId === category.categoryId) ? [...current] : [category, ...current]);
    setCategoryForm((current) => ({ ...current, categoryId: category.categoryId }));
    setProductForm((current) => ({ ...current, categoryId: category.categoryId }));
    setSuccess("Kategori berhasil disiapkan.");
    return true;
  }

  async function saveSupplier() {
    resetMessages();
    if (!supplierForm.enabled) return true;
    if (supplierForm.supplierId) {
      setProductForm((current) => ({ ...current, supplierId: supplierForm.supplierId }));
      return true;
    }
    if (!supplierForm.nama.trim()) {
      setValidation({ nama: "Nama supplier wajib diisi jika supplier ditambahkan" });
      return false;
    }

    const response = await supplierService.create({
      nama: supplierForm.nama.trim(),
      kontak: supplierForm.kontak.trim(),
      userId: currentUserId,
    });
    if (!response.success || !response.data) {
      setValidation(response.errors ?? { form: response.message });
      return false;
    }

    const supplier = response.data;
    setSuppliers((current) => current.some((item) => item.supplierId === supplier.supplierId) ? [...current] : [supplier, ...current]);
    setSupplierForm((current) => ({ ...current, supplierId: supplier.supplierId }));
    setProductForm((current) => ({ ...current, supplierId: supplier.supplierId }));
    setSuccess("Supplier berhasil disiapkan.");
    return true;
  }

  async function saveProduct() {
    resetMessages();
    const price = Number(productForm.harga);
    const nextValidation: Record<string, string> = {};
    if (!productForm.nama.trim()) nextValidation.nama = "Nama produk wajib diisi";
    if (!productForm.harga || Number.isNaN(price)) nextValidation.harga = "Harga produk wajib diisi";
    else if (price < 0) nextValidation.harga = "Harga tidak boleh negatif";
    if (!productForm.categoryId) nextValidation.categoryId = "Kategori wajib dipilih";
    if (!productForm.outletId) nextValidation.outletId = "Outlet wajib dipilih";

    if (Object.keys(nextValidation).length > 0) {
      setValidation(nextValidation);
      return false;
    }

    const response = await productService.create({
      nama: productForm.nama.trim(),
      harga: price,
      categoryId: productForm.categoryId,
      supplierId: productForm.supplierId || selectedSupplier?.supplierId,
      outletId: productForm.outletId,
      sku: `SKU-${Date.now()}`,
    });

    if (!response.success || !response.data) {
      setValidation(response.errors ?? { form: response.message });
      return false;
    }

    const product = response.data;
    setProducts((current) => current.some((item) => item.productId === product.productId) ? [...current] : [product, ...current]);
    setInventoryForm((current) => ({ ...current, productId: product.productId, outletId: product.outletId ?? current.outletId }));
    setSuccess("Produk berhasil disiapkan.");
    return true;
  }

  async function saveInventory() {
    resetMessages();
    const stock = Number(inventoryForm.stok);
    const nextValidation: Record<string, string> = {};
    if (!inventoryForm.productId) nextValidation.productId = "Produk wajib dipilih";
    if (!inventoryForm.outletId) nextValidation.outletId = "Outlet wajib dipilih";
    if (!inventoryForm.stok || Number.isNaN(stock)) nextValidation.stok = "Stok awal wajib diisi";
    else if (stock < 0) nextValidation.stok = "Stok tidak boleh negatif";

    if (Object.keys(nextValidation).length > 0) {
      setValidation(nextValidation);
      return false;
    }

    const existing = inventory.find((item) => item.productId === inventoryForm.productId && item.outletId === inventoryForm.outletId);
    const response = existing
      ? await inventoryService.adjust({ productId: inventoryForm.productId, outletId: inventoryForm.outletId, quantity: stock, type: "set" })
      : await inventoryService.create({ productId: inventoryForm.productId, outletId: inventoryForm.outletId, stok: stock });

    if (!response.success || !response.data) {
      setValidation(response.errors ?? { form: response.message });
      return false;
    }

    const inventoryRow = response.data;
    setInventory((current) => existing
      ? current.map((item) => item.inventoryId === inventoryRow.inventoryId ? inventoryRow : item)
      : current.some((item) => item.inventoryId === inventoryRow.inventoryId) ? [...current] : [inventoryRow, ...current]);
    setSuccess("Stok awal berhasil disiapkan.");
    return true;
  }

  async function handleNext() {
    setSaving(true);
    const handlers: Record<StepKey, () => Promise<boolean>> = {
      outlet: saveOutlet,
      category: saveCategory,
      supplier: saveSupplier,
      product: saveProduct,
      inventory: saveInventory,
    };

    const ok = await handlers[currentStep.key]();
    setSaving(false);
    if (!ok) return;

    if (stepIndex === steps.length - 1) {
      router.push("/dashboard");
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleSkipSupplier() {
    setSupplierForm({ enabled: false, supplierId: "", nama: "", kontak: "" });
    resetMessages();
    setStepIndex((current) => current + 1);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState title="Memuat onboarding..." description="Menyiapkan data outlet, kategori, supplier, produk, dan stok." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Onboarding POSmart</h1>
          <p className="mt-0.5 text-sm text-gray-500">Lengkapi konfigurasi awal agar usaha siap digunakan di dashboard dan POS.</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Progress</p>
          <p className="mt-1 font-bold text-gray-900">{progress}% selesai</p>
        </div>
      </div>

      <div className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <button
              key={step.key}
              onClick={() => index <= stepIndex && setStepIndex(index)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                index === stepIndex
                  ? "bg-orange-50 text-[#FF6B00]"
                  : index < stepIndex
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
              }`}
            >
              <span className="block">Step {index + 1}</span>
              <span className="block truncate">{step.title}</span>
              <span className="mt-0.5 block text-[10px] font-semibold">{step.required ? "Wajib" : "Opsional"}</span>
            </button>
          ))}
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {error && <ErrorState title="Onboarding gagal" description={error} />}

      <div className="rounded-[20px] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Step {stepIndex + 1}</p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-900">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{currentStep.required ? "Langkah ini wajib diselesaikan." : "Langkah ini dapat dilewati jika belum dibutuhkan."}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
            {currentStep.key === "outlet" ? <Store size={21} /> : <PackagePlus size={21} />}
          </div>
        </div>

        {currentStep.key === "outlet" && (
          <div className="max-w-xl space-y-4">
            {outlets.length > 0 && (
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {(["select", "create"] as const).map((mode) => (
                  <button key={mode} onClick={() => setOutletForm((current) => ({ ...current, mode }))} className={`flex-1 rounded-lg py-2 text-sm font-bold ${outletForm.mode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    {mode === "select" ? "Pilih Outlet" : "Buat Baru"}
                  </button>
                ))}
              </div>
            )}
            {outletForm.mode === "select" && outlets.length > 0 ? (
              <Field label="Outlet">
                <select value={outletForm.outletId} onChange={(event) => setOutletForm((current) => ({ ...current, outletId: event.target.value }))} className="input-field">
                  {outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.nama}</option>)}
                </select>
                {validation.outletId && <ErrorText>{validation.outletId}</ErrorText>}
              </Field>
            ) : (
              <>
                <Field label="Nama outlet">
                  <input value={outletForm.nama} onChange={(event) => setOutletForm((current) => ({ ...current, nama: event.target.value }))} className="input-field" placeholder="Contoh: Kedai Kopi Senja" />
                  {validation.nama && <ErrorText>{validation.nama}</ErrorText>}
                </Field>
                <Field label="Alamat">
                  <textarea value={outletForm.alamat} onChange={(event) => setOutletForm((current) => ({ ...current, alamat: event.target.value }))} rows={4} className="input-field resize-none" placeholder="Alamat outlet" />
                </Field>
              </>
            )}
          </div>
        )}

        {currentStep.key === "category" && (
          <div className="max-w-xl space-y-4">
            {categories.length > 0 && (
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {(["select", "create"] as const).map((mode) => (
                  <button key={mode} onClick={() => setCategoryForm((current) => ({ ...current, mode }))} className={`flex-1 rounded-lg py-2 text-sm font-bold ${categoryForm.mode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    {mode === "select" ? "Pilih Kategori" : "Buat Baru"}
                  </button>
                ))}
              </div>
            )}
            {categoryForm.mode === "select" && categories.length > 0 ? (
              <Field label="Kategori">
                <select value={categoryForm.categoryId} onChange={(event) => setCategoryForm((current) => ({ ...current, categoryId: event.target.value }))} className="input-field">
                  {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.nama}</option>)}
                </select>
                {validation.categoryId && <ErrorText>{validation.categoryId}</ErrorText>}
              </Field>
            ) : (
              <Field label="Nama kategori">
                <input value={categoryForm.nama} onChange={(event) => setCategoryForm((current) => ({ ...current, nama: event.target.value }))} className="input-field" placeholder="Contoh: Minuman" />
                {validation.nama && <ErrorText>{validation.nama}</ErrorText>}
              </Field>
            )}
          </div>
        )}

        {currentStep.key === "supplier" && (
          <div className="max-w-xl space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
              <input type="checkbox" checked={supplierForm.enabled} onChange={(event) => setSupplierForm((current) => ({ ...current, enabled: event.target.checked }))} className="mt-1 accent-orange-500" />
              <span>
                <span className="block text-sm font-bold text-gray-800">Tambahkan supplier sekarang</span>
                <span className="block text-sm text-gray-500">Opsional. Supplier dapat dilewati dan ditambahkan nanti.</span>
              </span>
            </label>
            {supplierForm.enabled && suppliers.length > 0 && (
              <Field label="Pilih supplier existing">
                <select value={supplierForm.supplierId} onChange={(event) => setSupplierForm((current) => ({ ...current, supplierId: event.target.value }))} className="input-field">
                  <option value="">Buat supplier baru</option>
                  {suppliers.map((supplier) => <option key={supplier.supplierId} value={supplier.supplierId}>{supplier.nama}</option>)}
                </select>
              </Field>
            )}
            {supplierForm.enabled && !supplierForm.supplierId && (
              <>
                <Field label="Nama supplier">
                  <input value={supplierForm.nama} onChange={(event) => setSupplierForm((current) => ({ ...current, nama: event.target.value }))} className="input-field" placeholder="Contoh: Nusantara Roastery" />
                  {validation.nama && <ErrorText>{validation.nama}</ErrorText>}
                </Field>
                <Field label="Kontak">
                  <input value={supplierForm.kontak} onChange={(event) => setSupplierForm((current) => ({ ...current, kontak: event.target.value }))} className="input-field" placeholder="Nomor telepon atau email" />
                </Field>
              </>
            )}
          </div>
        )}

        {currentStep.key === "product" && (
          <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nama produk">
              <input value={productForm.nama} onChange={(event) => setProductForm((current) => ({ ...current, nama: event.target.value }))} className="input-field" placeholder="Contoh: Kopi Susu Gula Aren" />
              {validation.nama && <ErrorText>{validation.nama}</ErrorText>}
            </Field>
            <Field label="Harga">
              <input type="number" value={productForm.harga} onChange={(event) => setProductForm((current) => ({ ...current, harga: event.target.value }))} className="input-field" placeholder="22000" />
              {validation.harga && <ErrorText>{validation.harga}</ErrorText>}
            </Field>
            <Field label="Kategori">
              <select value={productForm.categoryId} onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))} className="input-field">
                <option value="">Pilih kategori</option>
                {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.nama}</option>)}
              </select>
              {validation.categoryId && <ErrorText>{validation.categoryId}</ErrorText>}
            </Field>
            <Field label="Supplier opsional">
              <select value={productForm.supplierId} onChange={(event) => setProductForm((current) => ({ ...current, supplierId: event.target.value }))} className="input-field">
                <option value="">Tanpa supplier</option>
                {suppliers.map((supplier) => <option key={supplier.supplierId} value={supplier.supplierId}>{supplier.nama}</option>)}
              </select>
            </Field>
            <Field label="Outlet">
              <select value={productForm.outletId} onChange={(event) => setProductForm((current) => ({ ...current, outletId: event.target.value }))} className="input-field">
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.nama}</option>)}
              </select>
              {validation.outletId && <ErrorText>{validation.outletId}</ErrorText>}
            </Field>
          </div>
        )}

        {currentStep.key === "inventory" && (
          <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Produk">
              <select value={inventoryForm.productId} onChange={(event) => setInventoryForm((current) => ({ ...current, productId: event.target.value }))} className="input-field">
                <option value="">Pilih produk</option>
                {products.map((product) => <option key={product.productId} value={product.productId}>{product.nama}</option>)}
              </select>
              {validation.productId && <ErrorText>{validation.productId}</ErrorText>}
            </Field>
            <Field label="Outlet">
              <select value={inventoryForm.outletId} onChange={(event) => setInventoryForm((current) => ({ ...current, outletId: event.target.value }))} className="input-field">
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.nama}</option>)}
              </select>
              {validation.outletId && <ErrorText>{validation.outletId}</ErrorText>}
            </Field>
            <Field label="Stok awal">
              <input type="number" value={inventoryForm.stok} onChange={(event) => setInventoryForm((current) => ({ ...current, stok: event.target.value }))} className="input-field" placeholder="0" />
              {validation.stok && <ErrorText>{validation.stok}</ErrorText>}
            </Field>
          </div>
        )}

        {validation.form && <p className="mt-4 text-sm font-semibold text-red-500">{validation.form}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <button
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0 || saving}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Sebelumnya
          </button>
          <div className="flex items-center gap-2">
            {currentStep.key === "supplier" && (
              <button onClick={handleSkipSupplier} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600">
                Lewati Supplier
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : stepIndex === steps.length - 1 ? "Selesai dan ke Dashboard" : "Simpan dan Lanjut"}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs font-semibold text-red-500">{children}</p>;
}
