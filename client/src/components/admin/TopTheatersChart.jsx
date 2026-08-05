import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TopTheatersTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const { name, city, revenue, bookings } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c] border border-nebula-violet/25 rounded-xl px-3 py-2 text-sm max-w-56 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <p className="text-white font-medium truncate">{name}</p>
      <p className="text-gray-500 text-xs">{city}</p>
      <p className="text-gray-400 mt-1">
        {currency}
        {revenue.toLocaleString()} · {bookings} booking{bookings === 1 ? "" : "s"}
      </p>
    </div>
  );
};

const truncateName = (name) => (name.length > 18 ? `${name.slice(0, 17)}…` : name);

const TopTheatersChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No theater revenue in this date range
      </div>
    );
  }

  const chartData = [...data].reverse();
  const height = Math.max(180, chartData.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="theaterBarFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D5CFF" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3FD8E0" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          tickFormatter={truncateName}
          stroke="#787777"
          tick={{ fill: "#e5e7eb", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip content={<TopTheatersTooltip currency={currency} />} cursor={{ fill: "#6D5CFF10" }} />
        <Bar dataKey="revenue" fill="url(#theaterBarFill)" radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopTheatersChart;
