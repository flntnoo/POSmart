"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { analyticsService, customerService, inventoryService, outletService, productService, transactionService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { AnalyticsSummary, Customer, Inventory, Outlet, Product, Transaction } from "@/types/posmart";
import { Boxes, PackagePlus, ShoppingCart, Store } from "lucide-react";

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} Juta`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} Ribu`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function DashboardPage() {
  const { currentUser } = useSession();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      const userId = currentUser?.userId;
      const [summaryResponse, transactionResponse, inventoryResponse, productResponse, outletResponse, customerResponse] = await Promise.all([
        analyticsService.summary({ userId }),
        transactionService.list({ userId }),
        inventoryService.list({ userId }),
        productService.list({ userId }),
        outletService.list({ userId }),
        customerService.list({ userId }),
      ]);

      if (!mounted) return;

      if (summaryResponse.success && summaryResponse.data) setSummary(summaryResponse.data);
      else setError(summaryResponse.message);
      if (transactionResponse.success && transactionResponse.data) setTransactions(transactionResponse.data);
      if (inventoryResponse.success && inventoryResponse.data) setInventory(inventoryResponse.data);
      if (productResponse.success && productResponse.data) setProducts(productResponse.data);
      if (outletResponse.success && outletResponse.data) setOutlets(outletResponse.data);
      if (customerResponse.success && customerResponse.data) setCustomers(customerResponse.data);
      setLoading(false);
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [currentUser?.userId]);

  const productById = useMemo(() => new Map(products.map((product) => [product.productId, product])), [products]);
  const outletById = useMemo(() => new Map(outlets.map((outlet) => [outlet.outletId, outlet])), [outlets]);
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.customerId, customer])), [customers]);
  const successfulTransactions = useMemo(() => transactions.filter((transaction) => transaction.status === "Sukses"), [transactions]);
  const lowStock = useMemo(() => inventory.filter((item) => item.stok <= item.minStock), [inventory]);
  const hasTransactions = (summary?.jumlahTransaksi ?? 0) > 0;

  const stats = [
    {
      id: "revenue",
      title: "Pendapatan",
      value: formatRp(summary?.totalPendapatan ?? 0),
      subtitle: `${summary?.jumlahTransaksi ?? 0} transaksi sukses`,
      icon: "trending-up",
      highlight: true,
    },
    {
      id: "transactions",
      title: "Transaksi",
      value: String(summary?.jumlahTransaksi ?? 0),
      subtitle: "Data dari transaksi POS",
      icon: "shopping-cart",
    },
    {
      id: "products",
      title: "Produk Aktif",
      value: String(products.length),
      subtitle: `${lowStock.length} stok menipis`,
      icon: "package",
    },
    {
      id: "outlets",
      title: "Outlet",
      value: String(outlets.length),
      subtitle: "Outlet dalam workspace",
      icon: "users",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-800">Dashboard Anda</h1>
          <p className="mt-1.5 text-base text-slate-500">
            Selamat datang, {currentUser?.nama ?? "Pengguna POSmart"}
          </p>
        </div>
        <Link href="/pos" className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E85F00]">
          <ShoppingCart size={16} />
          Buka POS
        </Link>
      </div>

      {loading ? (
        <LoadingState title="Memuat dashboard..." description="Mengambil data workspace dari backend." />
      ) : error ? (
        <ErrorState title="Dashboard belum bisa dimuat" description={error} />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>

          {!hasTransactions && (
            <div className="mt-6">
              <EmptyState
                title="Belum ada transaksi"
                description={products.length > 0 ? "Produk dan stok awal sudah siap. Buka POS untuk membuat transaksi pertama." : "Selesaikan onboarding atau tambahkan produk agar dashboard mulai terisi."}
                actionHref={products.length > 0 ? "/pos" : "/onboarding"}
                actionLabel={products.length > 0 ? "Buka POS" : "Lanjut Onboarding"}
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <section className="rounded-[20px] bg-white p-6 shadow-sm xl:col-span-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-700">Transaksi Terbaru</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Riwayat transaksi sukses dari workspace aktif</p>
                </div>
                <Link href="/transactions" className="text-xs font-medium text-orange-500 hover:underline">Lihat semua</Link>
              </div>

              {successfulTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6">
                  <EmptyState title="Belum ada transaksi sukses" description="Transaksi terbaru akan muncul setelah kasir memproses penjualan." actionHref="/pos" actionLabel="Buka POS" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Transaksi</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Outlet</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pelanggan</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {successfulTransactions.slice(0, 5).map((transaction) => (
                        <tr key={transaction.transactionId} className="border-b border-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{transaction.transactionId}</p>
                            <p className="text-xs text-gray-400">{formatDate(transaction.tanggal)}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{outletById.get(transaction.outletId)?.nama ?? transaction.outletId}</td>
                          <td className="px-4 py-3 text-gray-500">{customerById.get(transaction.customerId ?? "")?.nama ?? "Walk-in Customer"}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRp(transaction.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-[20px] bg-white p-6 shadow-sm xl:col-span-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-700">Stok Menipis</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Berdasarkan stok minimum</p>
                </div>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">{lowStock.length} produk</span>
              </div>

              {lowStock.length === 0 ? (
                <EmptyState title="Stok aman" description="Belum ada produk yang berada di bawah batas minimum." actionHref="/inventory" actionLabel="Atur Stok" />
              ) : (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((item) => {
                    const product = productById.get(item.productId);
                    return (
                      <div key={item.inventoryId} className="rounded-2xl border border-red-100 bg-red-50/40 p-3">
                        <p className="truncate text-sm font-bold text-gray-800">{product?.nama ?? item.productId}</p>
                        <p className="mt-1 text-xs text-gray-500">{outletById.get(item.outletId)?.nama ?? item.outletId}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-red-500">{item.stok} unit tersisa</span>
                          <span className="text-gray-400">Min {item.minStock}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { href: "/products", label: "Tambah produk", icon: PackagePlus, description: "Lengkapi katalog penjualan" },
              { href: "/inventory", label: "Atur stok", icon: Boxes, description: "Sesuaikan stok per outlet" },
              { href: "/outlets", label: "Kelola outlet", icon: Store, description: "Cek lokasi usaha aktif" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{action.label}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
