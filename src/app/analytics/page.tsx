"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, FileText, RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { analyticsService, outletService } from "@/services";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { useSession } from "@/contexts/SessionContext";
import type { AnalyticsSummary, Outlet } from "@/types/posmart";

type FilterState = {
  outletId: string;
  startDate: string;
  endDate: string;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function AnalyticsPage() {
  const { currentUser } = useSession();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [filters, setFilters] = useState<FilterState>({ outletId: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FilterState, string>>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSummary(nextFilters = filters) {
    setLoading(true);
    setErrorMessage("");
    const response = await analyticsService.summary({
      outletId: nextFilters.outletId || undefined,
      startDate: nextFilters.startDate || undefined,
      endDate: nextFilters.endDate || undefined,
      userId: currentUser?.userId,
    });

    if (response.success && response.data) {
      setSummary(response.data);
    } else {
      setErrorMessage(response.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      const [outletResponse, summaryResponse] = await Promise.all([
        outletService.list({ userId: currentUser?.userId }),
        analyticsService.summary({ userId: currentUser?.userId }),
      ]);

      if (outletResponse.success && outletResponse.data) {
        setOutlets(outletResponse.data);
      }

      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      } else {
        setErrorMessage(summaryResponse.message);
      }

      setLoading(false);
    }

    initialize();
  }, [currentUser?.userId]);

  const averageTransaction = useMemo(() => {
    if (!summary?.jumlahTransaksi) return 0;
    return summary.totalPendapatan / summary.jumlahTransaksi;
  }, [summary]);

  const topRevenue = useMemo(() => {
    if (!summary?.produkTerlaris.length) return 0;
    return Math.max(...summary.produkTerlaris.map((product) => product.revenue));
  }, [summary]);

  const topTrendValue = useMemo(() => {
    if (!summary?.trenPendapatan.length) return 0;
    return Math.max(...summary.trenPendapatan.map((item) => item.total));
  }, [summary]);

  function validateFilters() {
    const nextErrors: Partial<Record<keyof FilterState, string>> = {};

    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      nextErrors.endDate = "Tanggal akhir tidak boleh sebelum tanggal mulai";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFilters()) return;
    loadSummary();
  }

  function handleReset() {
    const nextFilters = { outletId: "", startDate: "", endDate: "" };
    setFilters(nextFilters);
    setErrors({});
    loadSummary(nextFilters);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-500">Ringkasan performa penjualan dan produk terlaris</p>
        </div>
        <button
          type="button"
          onClick={() => loadSummary()}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Muat Ulang
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Outlet</span>
            <select
              value={filters.outletId}
              onChange={(event) => setFilters((current) => ({ ...current, outletId: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-300"
            >
              <option value="">Semua Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.outletId} value={outlet.outletId}>
                  {outlet.nama}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tanggal Mulai</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-300"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tanggal Akhir</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
              className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-300 ${
                errors.endDate ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.endDate && <span className="mt-1 block text-xs font-semibold text-red-500">{errors.endDate}</span>}
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]"
            >
              <BarChart3 size={15} />
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {loading && <LoadingState title="Memuat analytics..." description="Mengambil ringkasan performa dari backend." />}

      {!loading && errorMessage && (
        <ErrorState title="Analytics belum bisa dimuat" description={errorMessage} />
      )}

      {!loading && !errorMessage && summary && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Pendapatan</p>
                <TrendingUp size={18} className="text-orange-500" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-gray-900">{formatCurrency(summary.totalPendapatan)}</p>
              <p className="mt-2 text-xs font-medium text-gray-500">Dari transaksi berstatus sukses</p>
            </div>

            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Jumlah Transaksi</p>
                <FileText size={18} className="text-blue-500" />
              </div>
              <p className="mt-3 text-5xl font-extrabold text-gray-900">{summary.jumlahTransaksi}</p>
              <p className="mt-2 text-xs font-medium text-gray-500">Transaksi pada filter aktif</p>
            </div>

            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rata-rata Transaksi</p>
                <CalendarDays size={18} className="text-emerald-500" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-gray-900">{formatCurrency(averageTransaction)}</p>
              <p className="mt-2 text-xs font-medium text-gray-500">Total pendapatan dibagi jumlah transaksi</p>
            </div>
          </div>

          {summary.jumlahTransaksi === 0 ? (
            <EmptyState
              title="Belum ada data analytics"
              description="Tidak ada transaksi sukses yang sesuai dengan filter yang dipilih."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <section className="rounded-[20px] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Produk Terlaris</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Diurutkan berdasarkan quantity terjual</p>
                  </div>
                  <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-500">
                    {summary.produkTerlaris.length} produk
                  </span>
                </div>

                <div className="space-y-3">
                  {summary.produkTerlaris.map((product, index) => {
                    const width = topRevenue ? Math.max((product.revenue / topRevenue) * 100, 8) : 8;
                    return (
                      <div key={product.productId} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {index + 1}. {product.nama}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500">{product.quantity} item terjual</p>
                          </div>
                          <p className="text-sm font-extrabold text-gray-900">{formatCurrency(product.revenue)}</p>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[20px] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Tren Pendapatan</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Pendapatan per tanggal dari transaksi sukses</p>
                  </div>
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-500">
                    {summary.trenPendapatan.length} hari
                  </span>
                </div>

                <div className="space-y-3">
                  {summary.trenPendapatan.map((item) => {
                    const width = topTrendValue ? Math.max((item.total / topTrendValue) * 100, 8) : 8;
                    return (
                      <div key={`${item.label}-${item.total}`} className="grid grid-cols-[100px_1fr_120px] items-center gap-3">
                        <span className="text-xs font-bold text-gray-500">{item.label}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-right text-xs font-extrabold text-gray-800">{formatCurrency(item.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
