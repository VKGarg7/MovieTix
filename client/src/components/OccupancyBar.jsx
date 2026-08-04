import React from "react";

const colorForPct = (pct) => {
  if (pct === null) return "bg-gray-500";
  if (pct >= 85) return "bg-red-500";
  if (pct >= 60) return "bg-orange-400";
  if (pct >= 30) return "bg-yellow-400";
  return "bg-green-500";
};

const OccupancyBar = ({ occupancyPct }) => {
  const unavailable = occupancyPct === null || occupancyPct === undefined;

  return (
    <div className="w-full">
      <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
        {!unavailable && (
          <div
            className={`h-full rounded-full transition-all ${colorForPct(occupancyPct)}`}
            style={{ width: `${Math.min(100, Math.max(0, occupancyPct))}%` }}
          />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {unavailable ? "Occupancy unavailable" : `${occupancyPct}% full`}
      </p>
    </div>
  );
};

export default OccupancyBar;
