"use client";

// Legacy demo-only component. The active /dashboard page does not import this module.
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { categoryData } from "@/data/dashboard";

const RADIAN = Math.PI / 180;

function PieLabel(props: Record<string, unknown>) {
  const cx = props.cx as number;
  const cy = props.cy as number;
  const midAngle = (props.midAngle as number) ?? 0;
  const innerRadius = props.innerRadius as number;
  const outerRadius = props.outerRadius as number;
  const name = props.name as string;
  const value = props.value as number;

  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontWeight: 700, pointerEvents: "none" }}>
      <tspan x={x} dy="-0.55em" fontSize={12}>{value}%</tspan>
      <tspan x={x} dy="1.3em" fontSize={9}>{name}</tspan>
    </text>
  );
}

export default function CategoryChart() {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-700">Kategori Produk</h3>
        <p className="mt-0.5 text-xs text-slate-400">Distribusi penjualan</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Exploded pie chart */}
        <div className="flex justify-center">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={88}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                labelLine={false}
                label={(props) => <PieLabel {...props} />}
                stroke="white"
                strokeWidth={3}
              >
                {categoryData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with progress bars */}
        <div className="space-y-2.5">
          {categoryData.map(item => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-800">{item.value}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${item.value}%`, backgroundColor: item.barColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
