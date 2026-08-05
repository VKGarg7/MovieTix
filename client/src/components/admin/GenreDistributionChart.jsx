import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#F84565", "#6D5CFF", "#3FD8E0", "#FFB86B", "#F87171", "#A78BFA", "#34D399", "#FBBF24"];

const GenreTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const { genre, bookings, revenue } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c] border border-white/10 rounded-xl px-3 py-2 text-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <p className="text-white font-medium">{genre}</p>
      <p className="text-gray-400">
        {bookings} booking{bookings === 1 ? "" : "s"} · {currency}
        {revenue.toLocaleString()}
      </p>
    </div>
  );
};

const GenreDistributionChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No genre data in this date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="bookings"
          nameKey="genre"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={entry.genre} fill={COLORS[i % COLORS.length]} style={{ filter: `drop-shadow(0 0 6px ${COLORS[i % COLORS.length]}66)` }} />
          ))}
        </Pie>
        <Tooltip content={<GenreTooltip currency={currency} />} />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GenreDistributionChart;
