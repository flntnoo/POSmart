// Legacy demo-only component. The active /dashboard page does not import this module.
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { topProductsData } from "@/data/dashboard";

function formatRp(value: number) {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} jt`;
  return `Rp ${(value / 1000).toFixed(0)} rb`;
}

export default function TopProducts() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-700">
            Produk Terlaris
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">Bulan ini</p>
        </div>
        <button className="text-xs font-medium text-orange-500 hover:underline">
          Lihat semua
        </button>
      </div>

      {/* Table header */}
      <div className="mb-3 grid grid-cols-12 gap-2 text-xs font-medium text-slate-400">
        <span className="col-span-1">#</span>
        <span className="col-span-5">Produk</span>
        <span className="col-span-2 text-right">Terjual</span>
        <span className="col-span-2 text-right">Revenue</span>
        <span className="col-span-2 text-right">Tren</span>
      </div>

      <div className="space-y-3">
        {topProductsData.map((product) => {
          const isPositive = product.trend >= 0;
          return (
            <div
              key={product.rank}
              className="grid grid-cols-12 items-center gap-2 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
            >
              {/* Rank */}
              <span
                className={`col-span-1 flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                  product.rank === 1
                    ? "bg-orange-500 text-white"
                    : product.rank === 2
                    ? "bg-slate-200 text-slate-600"
                    : product.rank === 3
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {product.rank}
              </span>

              {/* Name + category */}
              <div className="col-span-5">
                <p className="truncate text-sm font-medium text-slate-700">
                  {product.name}
                </p>
                <p className="text-xs text-slate-400">{product.category}</p>
              </div>

              {/* Sold */}
              <span className="col-span-2 text-right text-sm text-slate-600">
                {product.sold}
              </span>

              {/* Revenue */}
              <span className="col-span-2 text-right text-sm font-medium text-slate-700">
                {formatRp(product.revenue)}
              </span>

              {/* Trend */}
              <span
                className={`col-span-2 flex items-center justify-end gap-0.5 text-xs font-semibold ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {Math.abs(product.trend)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
