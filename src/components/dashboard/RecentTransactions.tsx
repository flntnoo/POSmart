// Legacy demo-only component. The active /dashboard page does not import this module.
import { recentTransactionsData } from "@/data/dashboard";
import { EmptyState } from "@/components/ui/AppState";

const methodColors: Record<string, string> = {
  QRIS: "bg-green-50 text-green-600",
  Tunai: "bg-blue-50 text-blue-600",
  Transfer: "bg-purple-50 text-purple-600",
  "Kartu Debit": "bg-orange-50 text-orange-600",
};

function formatRp(value: number) {
  if (value >= 1000000)
    return `+Rp ${(value / 1000000).toFixed(2).replace(".", ",")} jt`;
  return `+Rp ${(value / 1000).toFixed(0)} rb`;
}

export default function RecentTransactions() {
  return (
    <div className="flex h-full flex-col rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-700">
          Transaksi Terbaru
        </h3>
        <button className="text-xs font-medium text-orange-500 hover:underline">
          Lihat semua
        </button>
      </div>

      {recentTransactionsData.length === 0 ? (
        <EmptyState title="Belum ada transaksi" description="Transaksi terbaru akan muncul setelah kasir memproses penjualan." />
      ) : (
        <div className="flex flex-col gap-4">
          {recentTransactionsData.map((trx) => (
          <div key={trx.id} className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: trx.color }}
            >
              {trx.initials}
            </div>

            {/* Name + date */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {trx.name}
              </p>
              <p className="text-xs text-slate-400">{trx.date}</p>
            </div>

            {/* Amount + badge */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold text-slate-700">
                {formatRp(trx.amount)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  methodColors[trx.method] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {trx.method}
              </span>
            </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
