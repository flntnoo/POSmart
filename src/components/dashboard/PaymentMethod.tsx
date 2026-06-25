"use client";

// Legacy demo-only component. The active /dashboard page does not import this module.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { paymentMethodData } from "@/data/dashboard";

export default function PaymentMethod() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-700">
          Metode Pembayaran
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">Bulan ini</p>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={paymentMethodData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {paymentMethodData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value ?? 0}%`, ""]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 space-y-2">
        {paymentMethodData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
