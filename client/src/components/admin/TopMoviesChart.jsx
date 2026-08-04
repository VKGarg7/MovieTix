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
    <div className="bg-[#1a1a1c] border border-primary/20 rounded-md px-3 py-2 text-sm max-w-56">
      <p className="text-white font-medium truncate">{title}</p>
      <p className="text-gray-400">
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
      <div className="flex items-center justify-center h-64 text-gray-500 border border-primary/20 rounded-md bg-primary/5">
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
        <Tooltip content={<TopMoviesTooltip currency={currency} />} cursor={{ fill: "#F8456510" }} />
        <Bar dataKey="revenue" fill="#F84565" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopMoviesChart;
