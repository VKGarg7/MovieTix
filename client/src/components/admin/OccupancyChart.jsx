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
  if (pct >= 75) return "#22c55e";
  if (pct >= 40) return "#F84565";
  return "#787777";
};

const OccupancyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { title, showDateTime, occupiedCount, totalCapacity, occupancyPct } = payload[0].payload;
  return (
    <div className="bg-[#1a1a1c] border border-primary/20 rounded-md px-3 py-2 text-sm max-w-56">
      <p className="text-white font-medium truncate">{title}</p>
      <p className="text-gray-400">{dateFormat(showDateTime)}</p>
      <p className="text-gray-400">
        {occupiedCount}/{totalCapacity} seats · {occupancyPct}%
      </p>
    </div>
  );
};

const OccupancyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-primary/20 rounded-md bg-primary/5">
        No shows in this date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#2a2a2d" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="title" tick={false} axisLine={{ stroke: "#2a2a2d" }} />
        <YAxis
          domain={[0, 100]}
          stroke="#787777"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<OccupancyTooltip />} cursor={{ fill: "#F8456510" }} />
        <Bar dataKey="occupancyPct" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry) => (
            <Cell key={entry._id} fill={occupancyColor(entry.occupancyPct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OccupancyChart;
