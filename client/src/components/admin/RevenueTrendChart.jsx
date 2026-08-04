import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatDateLabel = (value) => {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const RevenueTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  const { revenue, bookings } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c] border border-primary/20 rounded-md px-3 py-2 text-sm">
      <p className="text-gray-400">{formatDateLabel(label)}</p>
      <p className="text-white font-medium">
        {currency}
        {revenue.toLocaleString()}
      </p>
      <p className="text-gray-400">{bookings} booking{bookings === 1 ? "" : "s"}</p>
    </div>
  );
};

const RevenueTrendChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-primary/20 rounded-md bg-primary/5">
        No revenue in this date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F84565" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F84565" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2a2a2d" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#2a2a2d" }}
        />
        <YAxis
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `${currency}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
        />
        <Tooltip content={<RevenueTooltip currency={currency} />} cursor={{ stroke: "#F84565", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#F84565"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart;
