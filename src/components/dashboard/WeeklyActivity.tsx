"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { weeklyActivityData } from "@/data/dashboard";

function formatRp(value: number) {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

export default function WeeklyActivity() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-700">
            Aktivitas Mingguan
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Pendapatan vs Pengeluaran
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FF6B00]" />
            Pendapatan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FFD4B3]" />
            Pengeluaran
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={weeklyActivityData}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            tickFormatter={formatRp}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "#F8FAFC" }}
            formatter={(value) => [formatRp(Number(value) || 0)]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="income"
            name="Pendapatan"
            fill="#FF6B00"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Pengeluaran"
            fill="#FFD4B3"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
