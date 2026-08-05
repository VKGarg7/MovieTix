import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { dateFormat } from "../../lib/dateFomat";

const occupancyColor = (pct) => {
  if (pct >= 75) return "#3FD8E0";
  if (pct >= 40) return "#F84565";
  return "#6b6b70";
};

const OccupancyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { title, showDateTime, occupiedCount, totalCapacity, occupancyPct } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c]/95 backdrop-blur-xl border border-primary/25 rounded-xl px-3.5 py-2.5 text-sm max-w-56 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <p className="text-white font-medium truncate">{title}</p>
      <p className="text-gray-500 text-xs">{dateFormat(showDateTime)}</p>
      <p className="text-gray-400 mt-0.5">
        {occupiedCount}/{totalCapacity} seats · {occupancyPct}%
      </p>
    </div>
  );
};

const OccupancyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No shows in this date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="title" tick={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
        <YAxis
          domain={[0, 100]}
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<OccupancyTooltip />} cursor={{ fill: "rgba(248,69,101,0.06)" }} />
        <Bar dataKey="occupancyPct" radius={[6, 6, 0, 0]} maxBarSize={28}>
          {data.map((entry) => (
            <Cell
              key={entry._id}
              fill={occupancyColor(entry.occupancyPct)}
              style={{ filter: `drop-shadow(0 0 6px ${occupancyColor(entry.occupancyPct)}66)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OccupancyChart;
