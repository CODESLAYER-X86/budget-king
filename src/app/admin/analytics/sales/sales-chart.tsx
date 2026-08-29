"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type DataPoint = {
  day: Date;
  orders: number;
  revenue: number;
  delivered: number;
};

export function SalesChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    day: d.day.toLocaleDateString("en-BD", { day: "numeric", month: "short" }),
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No sales data in this period
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4a017" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `tk ${v / 1000}k`} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number) => [formatTk(value), "Revenue"]}
            labelFormatter={(label: string) => label}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#d4a017"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTk(amount: number): string {
  return `tk ${amount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}
