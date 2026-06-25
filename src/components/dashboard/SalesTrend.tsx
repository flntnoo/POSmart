"use client";

// Legacy demo-only component. The active /dashboard page does not import this module.
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { salesTrendData } from "@/data/dashboard";

function formatRp(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
  return `${value}`;
}

export default function SalesTrend() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-700">
            Tren Penjualan
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Januari – Desember 2025
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-500">
          +12.5% YTD
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={salesTrendData}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            tickFormatter={formatRp}
            width={40}
          />
          <Tooltip
            formatter={(value) => [
              `Rp ${((Number(value) || 0) / 1000000).toFixed(1)} jt`,
              "Penjualan",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="penjualan"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
