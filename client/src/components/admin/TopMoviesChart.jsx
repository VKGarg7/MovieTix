import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TopMoviesTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const { title, revenue, bookings } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c]/95 backdrop-blur-xl border border-primary/25 rounded-xl px-3.5 py-2.5 text-sm max-w-56 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <p className="text-white font-medium truncate">{title}</p>
      <p className="text-gray-400 mt-0.5">
        {currency}
        {revenue.toLocaleString()} · {bookings} booking{bookings === 1 ? "" : "s"}
      </p>
    </div>
  );
};

const truncateTitle = (title) => (title.length > 18 ? `${title.slice(0, 17)}…` : title);

const TopMoviesChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No revenue in this date range
      </div>
    );
  }

  const chartData = [...data].reverse();
  const height = Math.max(180, chartData.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="topMoviesBarFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F84565" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFB86B" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis
          dataKey="title"
          type="category"
          tickFormatter={truncateTitle}
          stroke="#787777"
          tick={{ fill: "#e5e7eb", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip content={<TopMoviesTooltip currency={currency} />} cursor={{ fill: "rgba(248,69,101,0.06)" }} />
        <Bar dataKey="revenue" fill="url(#topMoviesBarFill)" radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopMoviesChart;
