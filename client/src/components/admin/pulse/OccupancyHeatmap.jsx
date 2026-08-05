import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { GridIcon } from "lucide-react";
import { occupancyTier } from "../../../lib/pulseStatus";

const SLOTS = [
  { label: "10AM", hour: 10 },
  { label: "1PM", hour: 13 },
  { label: "4PM", hour: 16 },
  { label: "7PM", hour: 19 },
  { label: "9PM", hour: 21 },
];

const nearestSlotIndex = (hour) => {
  let best = 0, bestDiff = Infinity;
  SLOTS.forEach((s, idx) => {
    const diff = Math.abs(s.hour - hour);
    if (diff < bestDiff) { bestDiff = diff; best = idx; }
  });
  return best;
};

const OccupancyHeatmap = ({ shows }) => {
  const { screens, grid } = useMemo(() => {
    const screenNames = [...new Set(shows.map((s) => s.screenName).filter(Boolean))].sort();
    const map = {};
    screenNames.forEach((name) => { map[name] = Array(SLOTS.length).fill(null); });

    shows.forEach((s) => {
      if (!s.screenName) return;
      const hour = new Date(s.showDateTime).getHours();
      const idx = nearestSlotIndex(hour);
      const current = map[s.screenName][idx];
      if (current === null || (s.occupancyPct ?? 0) > current) {
        map[s.screenName][idx] = s.occupancyPct ?? 0;
      }
    });

    return { screens: screenNames, grid: map };
  }, [shows]);

  if (screens.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
        <GridIcon className="w-3.5 h-3.5 text-nebula-violet" /> Occupancy Heatmap
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-gray-500 font-normal pb-1">Screen</th>
              {SLOTS.map((s) => (
                <th key={s.label} className="text-gray-500 font-normal pb-1">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {screens.map((screen) => (
              <tr key={screen}>
                <td className="text-gray-300 pr-3 whitespace-nowrap">{screen}</td>
                {grid[screen].map((pct, idx) => {
                  const tier = occupancyTier(pct);
                  return (
                    <td key={idx}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium"
                        style={{
                          background: pct === null ? "rgba(255,255,255,0.03)" : `${tier.color}33`,
                          border: `1px solid ${pct === null ? "rgba(255,255,255,0.08)" : `${tier.color}55`}`,
                          color: pct === null ? "#6b7280" : tier.color,
                        }}
                      >
                        {pct === null ? "—" : `${Math.round(pct)}%`}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OccupancyHeatmap;
