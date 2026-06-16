import { AlertTriangle } from "lucide-react";
import { lowStockData } from "@/data/dashboard";
import { EmptyState } from "@/components/ui/AppState";

function stockColor(stock: number, max: number) {
  const pct = (stock / max) * 100;
  if (pct <= 10) return { bar: "bg-red-500", text: "text-red-500", badge: "bg-red-50 text-red-500" };
  if (pct <= 20) return { bar: "bg-orange-400", text: "text-orange-500", badge: "bg-orange-50 text-orange-500" };
  return { bar: "bg-yellow-400", text: "text-yellow-600", badge: "bg-yellow-50 text-yellow-600" };
}

export default function LowStockAlert() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <h3 className="text-base font-semibold text-slate-700">
            Stok Menipis
          </h3>
        </div>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
          {lowStockData.length} produk
        </span>
      </div>

      {lowStockData.length === 0 ? (
        <EmptyState title="Stok aman" description="Belum ada produk yang berada di bawah batas minimum." />
      ) : (
        <div className="space-y-4">
          {lowStockData.map((item) => {
          const pct = Math.round((item.stock / item.maxStock) * 100);
          const colors = stockColor(item.stock, item.maxStock);

          return (
            <div key={item.id}>
              <div className="mb-1.5 flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">{item.sku}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${colors.badge}`}
                >
                  {item.stock} sisa
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
