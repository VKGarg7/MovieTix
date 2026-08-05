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
    <div className="bg-[#1a1a1c]/95 backdrop-blur-xl border border-primary/25 rounded-xl px-3.5 py-2.5 text-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <p className="text-gray-400 text-xs">{formatDateLabel(label)}</p>
      <p className="text-white font-medium mt-0.5">
        {currency}
        {revenue.toLocaleString()}
      </p>
      <p className="text-gray-500 text-xs">{bookings} booking{bookings === 1 ? "" : "s"}</p>
    </div>
  );
};

const RevenueTrendChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No revenue in this date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F84565" stopOpacity={0.4} />
            <stop offset="60%" stopColor="#F84565" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#F84565" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F84565" />
            <stop offset="100%" stopColor="#FFB86B" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `${currency}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
        />
        <Tooltip content={<RevenueTooltip currency={currency} />} cursor={{ stroke: "#F84565", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="url(#revenueStroke)"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
          dot={{ r: 0 }}
          activeDot={{ r: 5, fill: "#F84565", stroke: "#fff", strokeWidth: 2, style: { filter: "drop-shadow(0 0 8px rgba(248,69,101,0.9))" } }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart;
