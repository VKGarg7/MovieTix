import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MonitorPlayIcon } from "lucide-react";
import { occupancyTier } from "../../../lib/pulseStatus";

const TheaterScreenGrid = ({ shows }) => {
  const screens = useMemo(() => {
    const byScreen = {};
    shows.forEach((s) => {
      if (!s.screenName) return;
      const start = new Date(s.showDateTime).getTime();
      if (!byScreen[s.screenName] || start < byScreen[s.screenName].start) {
        byScreen[s.screenName] = { ...s, start };
      }
    });
    return Object.values(byScreen).sort((a, b) => a.screenName.localeCompare(b.screenName));
  }, [shows]);

  if (screens.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
        <MonitorPlayIcon className="w-3.5 h-3.5 text-nebula-cyan" /> Theater Screen Grid
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {screens.map((s, idx) => {
          const pct = s.occupancyPct;
          const tier = occupancyTier(pct);
          const isFull = pct >= 100;
          return (
            <motion.div
              key={s.screenName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col items-center gap-1.5"
              style={{ boxShadow: pct >= 75 ? `0 0 20px -8px ${tier.color}` : "none" }}
            >
              <p className="text-xs text-gray-300 font-medium">{s.screenName}</p>
              <p className="text-lg font-display font-semibold tabular-nums" style={{ color: tier.color }}>
                {isFull ? "FULL" : `${Math.round(pct ?? 0)}%`}
              </p>
              <div className="w-full h-1 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${tier.from}, ${tier.to})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct ?? 0)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TheaterScreenGrid;
