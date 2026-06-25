// Legacy demo-only component. The active /dashboard page does not import this module.
import { Crown } from "lucide-react";
import { topCustomersData } from "@/data/dashboard";

function formatRp(value: number) {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(2).replace(".", ",")} jt`;
  return `Rp ${(value / 1000).toFixed(0)} rb`;
}

export default function TopCustomers() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-700">
            Top Pelanggan
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">Berdasarkan total belanja</p>
        </div>
        <button className="text-xs font-medium text-orange-500 hover:underline">
          Lihat semua
        </button>
      </div>

      <div className="space-y-4">
        {topCustomersData.map((customer) => (
          <div key={customer.rank} className="flex items-center gap-3">
            {/* Rank indicator + Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: customer.color }}
              >
                {customer.initials}
              </div>
              {customer.rank === 1 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
                  <Crown size={9} className="text-white" />
                </span>
              )}
            </div>

            {/* Name + orders */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {customer.name}
              </p>
              <p className="text-xs text-slate-400">
                {customer.totalOrders} transaksi
              </p>
            </div>

            {/* Total spent */}
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                {formatRp(customer.totalSpent)}
              </p>
              <span className="text-xs text-slate-400">
                #{customer.rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
