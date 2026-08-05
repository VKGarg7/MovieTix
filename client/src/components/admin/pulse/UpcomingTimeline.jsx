import React from "react";
import { motion } from "framer-motion";
import { CalendarClockIcon } from "lucide-react";
import { occupancyTier } from "../../../lib/pulseStatus";
import { dateFormat } from "../../../lib/dateFomat";

const UpcomingTimeline = ({ shows }) => {
  if (shows.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
        <CalendarClockIcon className="w-3.5 h-3.5 text-nebula-violet" /> Upcoming — Next 24 Hours
      </p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {shows.map((s, idx) => {
          const tier = occupancyTier(s.occupancyPct);
          return (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 w-40 rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <p className="text-xs font-medium truncate">{s.title}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{s.screenName}</p>
              <p className="text-[10px] text-gray-500">{dateFormat(s.showDateTime)}</p>
              <div className="h-1 rounded-full bg-white/8 overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.occupancyPct ?? 0)}%`, background: `linear-gradient(90deg, ${tier.from}, ${tier.to})` }} />
              </div>
              <p className="text-[10px] mt-1 font-medium" style={{ color: tier.color }}>{Math.round(s.occupancyPct ?? 0)}% full</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingTimeline;
