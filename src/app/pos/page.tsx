"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { useSession } from "@/contexts/SessionContext";
import {
  auditLogService,
  categoryService,
  customerService,
  inventoryService,
  notificationService,
  outletService,
  productService,
  transactionService,
} from "@/services";
import type { Category, Customer, Inventory, Outlet, Product, Transaction } from "@/types/posmart";
import {
  AlertTriangle,
  Banknote,
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  FileText,
  Minus,
  Plus,
  QrCode,
  Search,
  Store,
  X,
} from "lucide-react";

type CartItem = {
  productId: string;
  quantity: number;
};

type DisplayCartItem = CartItem & {
  product: Product;
  categoryName: string;
  stock: number;
  subtotal: number;
};

type PaymentMethod = Transaction["metode"];

type TransactionSummary = {
  transaction: Transaction;
  outlet: Outlet;
  customerName: string;
  cashierName: string;
  items: DisplayCartItem[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
};

const paymentMethods: Array<{
  id: PaymentMethod;
  label: string;
  Icon: typeof QrCode;
  bg: string;
  text: string;
  border: string;
}> = [
  { id: "QRIS", label: "QRIS", Icon: QrCode, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-300" },
  { id: "Tunai", label: "Tunai", Icon: Banknote, bg: "bg-green-50", text: "text-green-600", border: "border-green-300" },
  { id: "Transfer", label: "Transfer", Icon: Building2, bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-300" },
  { id: "Kartu", label: "Kartu", Icon: CreditCard, bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-300" },
];

function formatRp(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

function todayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function POSPage() {
  const { currentUser, isAuthenticated } = useSession();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeOutletId, setActiveOutletId] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [cashInput, setCashInput] = useState("");
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");
      const [outletResponse, categoryResponse, productResponse, inventoryResponse, customerResponse] = await Promise.all([
        outletService.list({ userId: currentUser?.userId }),
        categoryService.list({ userId: currentUser?.userId }),
        productService.list({ userId: currentUser?.userId }),
        inventoryService.list({ userId: currentUser?.userId }),
        customerService.list({ userId: currentUser?.userId }),
      ]);

      if (!mounted) return;

      if (!outletResponse.success || !outletResponse.data) {
        setErrorMessage(outletResponse.message);
        setLoading(false);
        return;
      }

      setOutlets(outletResponse.data);
      setActiveOutletId(outletResponse.data[0]?.outletId ?? "");

      if (categoryResponse.success && categoryResponse.data) setCategories(categoryResponse.data);
      if (productResponse.success && productResponse.data) setProducts(productResponse.data);
      if (inventoryResponse.success && inventoryResponse.data) setInventory(inventoryResponse.data);
      if (customerResponse.success && customerResponse.data) setCustomers(customerResponse.data);
      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentUser?.userId]);

  const selectedOutlet = useMemo(
    () => outlets.find((outlet) => outlet.outletId === activeOutletId) ?? null,
    [activeOutletId, outlets],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.categoryId, category])),
    [categories],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.productId, product])),
    [products],
  );

  const inventoryByProduct = useMemo(() => {
    return new Map(
      inventory
        .filter((item) => item.outletId === activeOutletId)
        .map((item) => [item.productId, item]),
    );
  }, [activeOutletId, inventory]);

  const availableCategories = useMemo(() => {
    const categoryIds = new Set(
      products
        .filter((product) => product.outletId === activeOutletId && product.categoryId)
        .map((product) => product.categoryId),
    );
    return categories.filter((category) => categoryIds.has(category.categoryId));
  }, [activeOutletId, categories, products]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((product) => {
      if (product.outletId !== activeOutletId) return false;
      if (activeCategoryId !== "all" && product.categoryId !== activeCategoryId) return false;
      if (q && !product.nama.toLowerCase().includes(q) && !product.sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategoryId, activeOutletId, products, search]);

  const cartItems = useMemo<DisplayCartItem[]>(() => {
    return cart
      .map((item) => {
        const product = productById.get(item.productId);
        if (!product) return null;
        return {
          ...item,
          product,
          categoryName: categoryById.get(product.categoryId ?? "")?.nama ?? "-",
          stock: inventoryByProduct.get(item.productId)?.stok ?? 0,
          subtotal: product.harga * item.quantity,
        };
      })
      .filter((item): item is DisplayCartItem => Boolean(item));
  }, [cart, categoryById, inventoryByProduct, productById]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;
  const cashReceived = Number(cashInput);
  const change = paymentMethod === "Tunai" && cashInput ? Math.max(cashReceived - total, 0) : 0;

  function getStock(productId: string) {
    return inventoryByProduct.get(productId)?.stok ?? 0;
  }

  function handleOutletChange(outletId: string) {
    setActiveOutletId(outletId);
    setActiveCategoryId("all");
    setCart([]);
    setSummary(null);
    setValidationMessage("Keranjang dikosongkan karena outlet aktif berubah.");
  }

  function addToCart(product: Product) {
    setValidationMessage("");
    const stock = getStock(product.productId);
    if (stock <= 0) {
      setValidationMessage(`${product.nama} sedang tidak memiliki stok di outlet aktif.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.productId);
      if (existing) {
        if (existing.quantity >= stock) {
          setValidationMessage(`Stok ${product.nama} hanya tersisa ${stock} unit.`);
          return current;
        }
        return current.map((item) =>
          item.productId === product.productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { productId: product.productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setValidationMessage("");
    const product = productById.get(productId);
    const stock = getStock(productId);

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (!existing) return current;
      const nextQuantity = existing.quantity + delta;

      if (nextQuantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }

      if (nextQuantity > stock) {
        setValidationMessage(`Stok ${product?.nama ?? "produk"} hanya tersisa ${stock} unit.`);
        return current;
      }

      return current.map((item) => item.productId === productId ? { ...item, quantity: nextQuantity } : item);
    });
  }

  function removeItem(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  function validateCheckout() {
    if (!isAuthenticated || !currentUser) return "User harus login untuk membuat transaksi.";
    if (!activeOutletId || !selectedOutlet) return "Pilih outlet aktif terlebih dahulu.";
    if (cart.length === 0) return "Keranjang minimal memiliki satu item.";
    if (cartItems.length !== cart.length) return "Ada produk yang tidak ditemukan. Hapus item dan ulangi transaksi.";

    const invalidQuantity = cartItems.find((item) => item.quantity <= 0);
    if (invalidQuantity) return `Quantity ${invalidQuantity.product.nama} harus lebih dari 0.`;

    const insufficientStock = cartItems.find((item) => item.quantity > item.stock);
    if (insufficientStock) {
      return `Stok ${insufficientStock.product.nama} tidak cukup. Tersedia ${insufficientStock.stock}, diminta ${insufficientStock.quantity}.`;
    }

    if (!paymentMethod) return "Pilih metode pembayaran.";

    if (paymentMethod === "Tunai") {
      if (!cashInput || Number.isNaN(cashReceived)) return "Masukkan uang yang diterima.";
      if (cashReceived < total) return "Uang yang diterima belum mencukupi total transaksi.";
    }

    return "";
  }

  async function handleCheckout() {
    const validation = validateCheckout();
    if (validation) {
      setValidationMessage(validation);
      return;
    }

    if (!currentUser || !selectedOutlet) return;

    setCheckoutLoading(true);
    setValidationMessage("");

    const itemsSnapshot = cartItems.map((item) => ({ ...item }));
    const transactionResponse = await transactionService.create({
      customerId: selectedCustomerId || undefined,
      userId: currentUser.userId,
      outletId: activeOutletId,
      metode: paymentMethod,
      status: "Sukses",
      items: itemsSnapshot.map((item) => ({
        productId: item.product.productId,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    });

    if (!transactionResponse.success || !transactionResponse.data) {
      setValidationMessage(transactionResponse.errors?.items ?? transactionResponse.message);
      setCheckoutLoading(false);
      return;
    }

    const updatedInventory: Inventory[] = [];
    for (const item of itemsSnapshot) {
      const response = await inventoryService.adjust({
        productId: item.product.productId,
        outletId: activeOutletId,
        quantity: item.quantity,
        type: "out",
      });

      if (!response.success || !response.data) {
        setValidationMessage(response.errors?.stok ?? response.message);
        setCheckoutLoading(false);
        return;
      }

      updatedInventory.push(response.data);

      await auditLogService.create({
        userId: currentUser.userId,
        aksi: `Mengurangi stok ${item.product.nama} sebanyak ${item.quantity}`,
        module: "inventory",
      });

      if (response.data.stok <= response.data.minStock) {
        await notificationService.createLowStock({
          userId: currentUser.userId,
          productId: item.product.productId,
          outletId: activeOutletId,
          productName: item.product.nama,
          outletName: selectedOutlet.nama,
          stock: response.data.stok,
        });
      }
    }

    if (updatedInventory.length > 0) {
      setInventory((current) =>
        current.map((item) => updatedInventory.find((updated) => updated.inventoryId === item.inventoryId) ?? item),
      );
    }

    await auditLogService.create({
      userId: currentUser.userId,
      aksi: `Membuat transaksi ${transactionResponse.data.transactionId}`,
      module: "transactions",
    });

    const customer = customers.find((item) => item.customerId === selectedCustomerId);
    const amountPaid = paymentMethod === "Tunai" ? cashReceived : total;

    setSummary({
      transaction: transactionResponse.data,
      outlet: selectedOutlet,
      customerName: customer?.nama ?? "Walk-in Customer",
      cashierName: currentUser.nama,
      items: itemsSnapshot,
      paymentMethod,
      amountPaid,
      change: paymentMethod === "Tunai" ? Math.max(amountPaid - total, 0) : 0,
    });

    setCart([]);
    setCashInput("");
    setShowPayment(false);
    setCheckoutLoading(false);
  }

  function resetTransaction() {
    setSummary(null);
    setPaymentMethod("QRIS");
    setCashInput("");
    setValidationMessage("");
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen overflow-auto bg-[#F5F6FA] lg:h-screen lg:overflow-hidden">
        <Sidebar />

        <div className="ml-[72px] flex flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
          <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden bg-white">
            <div className="flex flex-shrink-0 flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-3.5">
              <div className="min-w-[220px]">
                <div className="flex items-center gap-2">
                  <Store size={15} className="text-[#FF6B00]" />
                  <select
                    value={activeOutletId}
                    onChange={(event) => handleOutletChange(event.target.value)}
                    className="max-w-[220px] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-orange-300"
                  >
                    {outlets.map((outlet) => (
                      <option key={outlet.outletId} value={outlet.outletId}>
                        {outlet.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{todayLabel()}</p>
              </div>

              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk atau SKU..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm placeholder:text-gray-400 outline-none focus:border-orange-300 focus:bg-white"
                />
              </div>

              <button className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
              </button>
            </div>

            <div className="flex flex-shrink-0 items-center gap-0 overflow-x-auto border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveCategoryId("all")}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                  activeCategoryId === "all" ? "text-[#FF6B00]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Semua
                {activeCategoryId === "all" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF6B00]" />}
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category.categoryId}
                  onClick={() => setActiveCategoryId(category.categoryId)}
                  className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                    activeCategoryId === category.categoryId ? "text-[#FF6B00]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {category.nama}
                  {activeCategoryId === category.categoryId && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF6B00]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading && <LoadingState title="Memuat POS..." description="Mengambil outlet, produk, stok, dan pelanggan." />}
              {!loading && errorMessage && <ErrorState title="Gagal memuat POS" description={errorMessage} />}
              {!loading && !errorMessage && outlets.length === 0 && (
                <EmptyState title="Belum ada outlet" description="Buat outlet terlebih dahulu sebelum memproses transaksi POS." actionHref="/outlets" actionLabel="Kelola Outlet" />
              )}
              {!loading && !errorMessage && outlets.length > 0 && filteredProducts.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <Search size={36} strokeWidth={1.5} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Produk tidak ditemukan</p>
                  <p className="mt-1 text-xs">Coba ubah outlet, kategori, atau kata kunci.</p>
                </div>
              )}
              {!loading && !errorMessage && outlets.length > 0 && filteredProducts.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      categoryName={categoryById.get(product.categoryId ?? "")?.nama ?? "-"}
                      stock={getStock(product.productId)}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col border-l border-gray-200 bg-white lg:w-[330px]">
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
              <p className="text-base font-bold text-gray-900">Daftar Pesanan</p>
              <p className="mt-0.5 text-xs text-gray-400">{selectedOutlet?.nama ?? "Outlet belum dipilih"}</p>

              <div className="mt-3">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Pelanggan</label>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-orange-300"
                >
                  <option value="">Walk-in Customer</option>
                  {customers
                    .filter((customer) => customer.nama !== "Walk-in Customer")
                    .map((customer) => (
                      <option key={customer.customerId} value={customer.customerId}>
                        {customer.nama}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {validationMessage && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{validationMessage}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                    <FileText size={28} strokeWidth={1.2} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada item</p>
                  <p className="mt-1 text-xs text-gray-400">Pilih produk untuk memulai transaksi.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cartItems.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      onDecrease={() => updateQuantity(item.productId, -1)}
                      onIncrease={() => updateQuantity(item.productId, 1)}
                      onRemove={() => removeItem(item.productId)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 space-y-4 border-t border-gray-100 p-5">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-700">{formatRp(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatRp(total)}</span>
                </div>
              </div>

              <button
                disabled={cart.length === 0 || !activeOutletId}
                onClick={() => {
                  const validation = validateCheckout();
                  if (validation) {
                    setValidationMessage(validation);
                    return;
                  }
                  setShowPayment(true);
                }}
                className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                  cart.length === 0 || !activeOutletId
                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                    : "bg-[#FF6B00] text-white hover:bg-[#E05E00]"
                }`}
              >
                Proses Pembayaran
              </button>

              <button
                onClick={() => {
                  setCart([]);
                  setValidationMessage("");
                }}
                className="w-full text-sm font-semibold text-[#FF6B00] transition-colors hover:text-[#E05E00]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>

        {showPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowPayment(false)} aria-label="Tutup pembayaran" />
            <div className="relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                <button onClick={() => setShowPayment(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Pembayaran</p>
                  <p className="text-xs text-gray-400">{selectedOutlet?.nama}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total</p>
                  <p className="text-lg font-extrabold text-[#FF6B00]">{formatRp(total)}</p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Ringkasan Item</p>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{item.product.nama}</p>
                          <p className="text-xs text-gray-400">{item.quantity} x {formatRp(item.product.harga)}</p>
                        </div>
                        <span className="font-bold text-gray-900">{formatRp(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Metode Pembayaran</p>
                  <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map(({ Icon, ...method }) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setCashInput("");
                          setValidationMessage("");
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition-all ${
                          paymentMethod === method.id
                            ? `${method.bg} ${method.border} ${method.text}`
                            : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[10px] font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "Tunai" && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">Uang yang Diterima</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={cashInput}
                        onChange={(event) => setCashInput(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
                      />
                    </div>
                    {cashInput && cashReceived >= total && (
                      <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                        <span className="text-sm font-semibold text-green-700">Kembalian</span>
                        <span className="text-lg font-extrabold text-green-600">{formatRp(change)}</span>
                      </div>
                    )}
                    {cashInput && cashReceived < total && (
                      <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                        <span className="text-sm font-semibold text-red-600">Kurang</span>
                        <span className="text-lg font-extrabold text-red-500">{formatRp(total - cashReceived)}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod !== "Tunai" && (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">{paymentMethod} mock payment</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">Belum ada integrasi payment gateway. Konfirmasi ini hanya mencatat metode pembayaran pada transaksi mock.</p>
                  </div>
                )}

                {validationMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{validationMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || (paymentMethod === "Tunai" && (!cashInput || cashReceived < total))}
                  className="w-full rounded-xl bg-[#FF6B00] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checkoutLoading ? "Memproses..." : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            <div className="relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-5 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 size={40} className="text-green-500" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-center text-xl font-extrabold text-gray-900">Transaksi Berhasil</h2>
              <p className="mt-1 text-center text-sm text-gray-500">Stok sudah dikurangi dan transaksi tersimpan di mock data.</p>

              <div className="my-6 space-y-3 rounded-2xl bg-gray-50 p-4 text-sm">
                <SummaryRow label="Transaction ID" value={summary.transaction.transactionId} />
                <SummaryRow label="Outlet" value={summary.outlet.nama} />
                <SummaryRow label="Pelanggan" value={summary.customerName} />
                <SummaryRow label="Kasir" value={summary.cashierName} />
                <SummaryRow label="Tanggal" value={formatDateTime(summary.transaction.tanggal)} />
                <SummaryRow label="Metode" value={summary.paymentMethod} />
                {summary.paymentMethod === "Tunai" && (
                  <>
                    <SummaryRow label="Uang diterima" value={formatRp(summary.amountPaid)} />
                    <SummaryRow label="Kembalian" value={formatRp(summary.change)} />
                  </>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Item</p>
                  <div className="space-y-2">
                    {summary.items.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{item.product.nama}</p>
                          <p className="text-xs text-gray-400">{item.quantity} x {formatRp(item.product.harga)}</p>
                        </div>
                        <span className="font-bold text-gray-900">{formatRp(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="font-extrabold text-[#FF6B00]">{formatRp(summary.transaction.total)}</span>
                </div>
              </div>

              <button
                onClick={resetTransaction}
                className="w-full rounded-xl bg-[#FF6B00] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]"
              >
                Transaksi Baru
              </button>
              <button
                onClick={resetTransaction}
                className="mt-2.5 w-full text-sm font-semibold text-gray-400 hover:text-gray-600"
              >
                Kembali ke Kasir
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function ProductCard({
  product,
  categoryName,
  stock,
  onAdd,
}: {
  product: Product;
  categoryName: string;
  stock: number;
  onAdd: (product: Product) => void;
}) {
  const isOutOfStock = stock <= 0;

  return (
    <div
      className={`flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm transition-all ${
        isOutOfStock ? "opacity-60" : "hover:shadow-md"
      }`}
      style={{ border: "1px solid #F3F4F6" }}
    >
      <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg font-black text-[#FF6B00]">
        {product.nama.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold leading-tight text-gray-900">{product.nama}</p>
        <p className="mt-1 text-xs font-semibold text-gray-400">{categoryName} - {product.sku ?? product.productId}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-600">{formatRp(product.harga)}</p>
          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${isOutOfStock ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
            Stok {stock}
          </span>
        </div>
        <button
          onClick={() => onAdd(product)}
          disabled={isOutOfStock}
          className="mt-2 w-full rounded-lg border border-orange-300 py-1 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
        >
          {isOutOfStock ? "Stok habis" : "Tambah ke keranjang"}
        </button>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: DisplayCartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">{item.product.nama}</p>
          <p className="mt-0.5 text-[10px] font-medium text-gray-400">{item.categoryName} - Stok {item.stock}</p>
        </div>
        <button onClick={onRemove} className="flex-shrink-0 text-gray-300 hover:text-red-400">
          <X size={14} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrease}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500"
          >
            <Minus size={11} />
          </button>
          <span className="w-5 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
          <button
            onClick={onIncrease}
            disabled={item.quantity >= item.stock}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={11} />
          </button>
        </div>
        <span className="text-sm font-bold text-gray-800">{formatRp(item.subtotal)}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  );
}
