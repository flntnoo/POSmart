"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useSession } from "@/contexts/SessionContext";
import {
  toTransactionView, formatRp,
  type Transaction, type TransactionStatus, type PaymentMethod,
} from "@/data/transactions";
import { customerService, productService, transactionService } from "@/services";
import {
  Search, Plus, X, Printer, FileDown,
  CheckCircle2, Clock, XCircle, Receipt,
} from "lucide-react";

type StatusFilter = "Semua" | TransactionStatus;
type MethodFilter = "Semua" | PaymentMethod;

const statusTabs: StatusFilter[] = ["Semua", "Sukses", "Pending", "Batal"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const statusStyles: Record<TransactionStatus, { pill: string; icon: React.ReactNode }> = {
  Sukses:  { pill: "bg-green-50 text-green-600",   icon: <CheckCircle2 size={11} /> },
  Pending: { pill: "bg-yellow-50 text-yellow-600", icon: <Clock size={11} /> },
  Batal:   { pill: "bg-red-50 text-red-500",       icon: <XCircle size={11} /> },
};

const methodStyles: Record<PaymentMethod, string> = {
  Tunai:    "bg-emerald-50 text-emerald-600",
  Transfer: "bg-orange-50 text-orange-500",
  QRIS:     "bg-purple-50 text-purple-600",
  Kartu:    "bg-slate-100 text-slate-600",
};

function formatJumlah(total: number, status: TransactionStatus) {
  const sign   = status === "Batal" ? "-" : "+";
  const color  = status === "Batal" ? "text-red-500" : "text-green-600";
  const amount = total.toLocaleString("id-ID");
  return { sign, color, amount };
}

function todayPrefix() {
  const today = new Date();
  return `${String(today.getDate()).padStart(2, "0")} ${monthLabels[today.getMonth()]} ${today.getFullYear()}`;
}

export default function TransactionsPage() {
  const { currentUser } = useSession();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("Semua");
  const [methodFilter, setMethod] = useState<MethodFilter>("Semua");
  const [detail, setDetail]       = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      transactionService.list({ userId: currentUser?.userId }),
      productService.list({ userId: currentUser?.userId }),
      customerService.list({ userId: currentUser?.userId }),
    ]).then(async ([transactionResponse, productResponse, customerResponse]) => {
      if (!mounted) return;
      const domainTransactions = transactionResponse.success && transactionResponse.data ? transactionResponse.data : [];
      const products = productResponse.success && productResponse.data ? productResponse.data : [];
      const customers = customerResponse.success && customerResponse.data ? customerResponse.data : [];
      const detailResponses = await Promise.all(domainTransactions.map((transaction) => transactionService.detail(transaction.transactionId)));
      if (!mounted) return;
      const details = detailResponses.flatMap((response) => response.success && response.data ? response.data.details : []);
      setTransactions(domainTransactions.map((transaction) => toTransactionView(transaction, {
        details,
        products,
        customers,
        users: currentUser ? [currentUser] : [],
      })));
    });
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const stats = useMemo(() => {
    const sukses   = transactions.filter(t => t.status === "Sukses");
    const batal    = transactions.filter(t => t.status === "Batal").length;
    const pending  = transactions.filter(t => t.status === "Pending").length;
    const revenue  = sukses.reduce((s, t) => s + t.total, 0);
    const today    = transactions.filter(t => t.date.startsWith(todayPrefix()));
    const todayOk  = today.filter(t => t.status === "Sukses").length;
    const methods  = new Set(transactions.map(t => t.method)).size;
    return { total: transactions.length, sukses: sukses.length, batal, pending, revenue, todayCount: today.length, todayOk, methods };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (statusFilter !== "Semua" && t.status !== statusFilter)   return false;
      if (methodFilter !== "Semua" && t.method !== methodFilter)   return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.id.toLowerCase().includes(q) && !t.customer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, methodFilter, search]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaksi</h1>
          <p className="mt-0.5 text-sm text-gray-500">Riwayat dan detail semua transaksi penjualan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50">
            <FileDown size={14} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]">
            <Plus size={15} strokeWidth={2.5} />
            Transaksi Baru
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 – orange gradient */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF9500 60%, #FFB347 100%)" }}
        >
          <div className="pointer-events-none absolute -right-7 -top-7 h-36 w-36 rounded-full border-2 border-white/20" />
          <div className="pointer-events-none absolute -right-1 -top-1 h-20 w-20 rounded-full border-2 border-white/20" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Total Transaksi</p>
          <p className="mt-1 text-5xl font-extrabold text-white">{stats.total}</p>
          <p className="mt-3 text-[11px] font-semibold text-white/70">
            <span className="text-white/80">Data dari backend</span>
          </p>
        </div>

        {/* Card 2 – Pendapatan */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pendapatan Sukses</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 leading-tight">
            {stats.revenue >= 1_000_000
              ? "Rp" + (stats.revenue / 1_000_000).toFixed(0) + " Jt"
              : formatRp(stats.revenue)}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sukses</span>
              <span className="text-xs font-semibold text-green-600">{stats.sukses} transaksi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sumber</span>
              <span className="text-xs font-semibold text-gray-600">Backend</span>
            </div>
          </div>
        </div>

        {/* Card 3 – Frekuensi Bayaran */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Frekuensi Bayaran</p>
          <p className="mt-1 text-5xl font-extrabold text-gray-900">{stats.methods}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Metode Aktif</span>
              <span className="text-xs font-semibold text-gray-600">Tunai, QRIS, dll.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pending</span>
              <span className="text-xs font-semibold text-yellow-600">{stats.pending} transaksi</span>
            </div>
          </div>
        </div>

        {/* Card 4 – Pesanan Selesai */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pesanan Selesai Hari Ini</p>
          <p className="mt-1 text-5xl font-extrabold text-gray-900">{stats.todayOk}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Hari Ini</span>
              <span className="text-xs font-semibold text-gray-600">{stats.todayCount} transaksi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Batal</span>
              <span className="text-xs font-semibold text-red-500">{stats.batal} transaksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari transaksi atau pelanggan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-300 sm:w-60"
          />
        </div>

        {/* Status tabs */}
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1">
          {statusTabs.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
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

        {/* Method */}
        <select
          value={methodFilter}
          onChange={e => setMethod(e.target.value as MethodFilter)}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 shadow-sm outline-none"
        >
          {(["Semua", "Tunai", "Transfer", "QRIS", "Kartu"] as const).map(m => (
            <option key={m} value={m}>{m === "Semua" ? "Semua Metode" : m}</option>
          ))}
        </select>

        <div className="hidden flex-1 xl:block" />

        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">
          {filtered.length} transaksi
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start gap-5 xl:flex-row">
        {/* Table */}
        <div className={`overflow-x-auto rounded-[20px] bg-white shadow-sm ${detail ? "w-full xl:min-w-0 xl:flex-1" : "w-full"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">No.</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pelanggan</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Produk</th>
                {!detail && <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Tanggal</th>}
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Metode</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Jumlah</th>
                <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const st  = statusStyles[tx.status];
                const { sign, color, amount } = formatJumlah(tx.total, tx.status);
                const isSelected = detail?.id === tx.id;
                const initial = tx.customer.slice(0, 1);
                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors hover:bg-gray-50/60 ${i < filtered.length - 1 ? "border-b border-gray-50" : ""} ${isSelected ? "bg-orange-50/40" : ""}`}
                  >
                    {/* No. */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] font-bold text-gray-400">{tx.id}</span>
                    </td>
                    {/* Pelanggan */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                          {initial}
                        </div>
                        <span className="font-semibold text-gray-800 whitespace-nowrap">{tx.customer}</span>
                      </div>
                    </td>
                    {/* Produk */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-600 line-clamp-1 max-w-[140px]">
                        {tx.items[0]?.name ?? "Detail item tidak tersedia"}
                      </span>
                      {tx.itemCount > 1 && (
                        <span className="text-[10px] text-gray-400"> +{tx.itemCount - 1} lainnya</span>
                      )}
                    </td>
                    {/* Tanggal */}
                    {!detail && (
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{tx.date}</td>
                    )}
                    {/* Metode */}
                    <td className="px-4 py-3.5">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${methodStyles[tx.method]}`}>
                        {tx.method}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${st.pill}`}>
                        {st.icon}
                        {tx.status}
                      </span>
                    </td>
                    {/* Jumlah */}
                    <td className={`px-4 py-3.5 text-right font-bold ${color}`}>
                      {sign}{amount}
                    </td>
                    {/* Aksi */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setDetail(detail?.id === tx.id ? null : tx)}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isSelected ? "bg-orange-100 text-orange-500" : "text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                        }`}
                      >
                        <Search size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={detail ? 7 : 8} className="py-14 text-center text-sm text-gray-400">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-400">
              Menampilkan {filtered.length} dari {transactions.length} transaksi
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

        {/* Detail panel */}
        {detail && (
          <div className="w-[320px] flex-shrink-0 overflow-hidden rounded-[20px] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-gray-900">Detail Transaksi</h2>
                <p className="mt-0.5 font-mono text-xs font-semibold text-gray-400">{detail.id}</p>
              </div>
              <button onClick={() => setDetail(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Customer chip */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  {detail.customer.slice(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{detail.customer}</p>
                  <p className="text-xs text-gray-400">Kasir: {detail.cashier}</p>
                </div>
                <span className={`ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyles[detail.status].pill}`}>
                  {statusStyles[detail.status].icon}
                  {detail.status}
                </span>
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tanggal</p>
                  <p className="mt-0.5 text-xs font-semibold text-gray-700">{detail.date}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Metode</p>
                  <span className={`mt-0.5 inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${methodStyles[detail.method]}`}>
                    {detail.method}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Item Dibeli</p>
                <div className="space-y-2.5">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                          <Receipt size={11} className="text-orange-400" />
                        </div>
                        <span className="truncate text-xs font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-[10px] text-gray-400">×{item.qty}  </span>
                        <span className="text-xs font-semibold text-gray-700">{formatRp(item.price * item.qty)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-700">{formatRp(detail.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pajak (10%)</span>
                  <span className="font-semibold text-gray-700">{formatRp(detail.tax)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-sm font-extrabold text-white">{formatRp(detail.total)}</span>
                </div>
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
                <Printer size={15} />
                Cetak Struk
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
