import React from "react";
import { motion } from "framer-motion";
import { ArmchairIcon } from "lucide-react";
import { SEAT_TYPE_META, summarizeRows } from "../../../lib/seatLayoutBuilder";

const ScreenSummaryStats = ({ rows }) => {
  const summary = summarizeRows(rows);

  const tiles = [
    { key: "total", label: "Total Seats", value: summary.total, color: "#F84565" },
    { key: "recliner", label: "VIP Seats", value: summary.recliner, color: SEAT_TYPE_META.recliner.color },
    { key: "premium", label: "Premium Seats", value: summary.premium, color: SEAT_TYPE_META.premium.color },
    { key: "regular", label: "Regular Seats", value: summary.regular, color: SEAT_TYPE_META.regular.color },
    { key: "accessible", label: "Accessibility Seats", value: summary.accessible, color: SEAT_TYPE_META.accessible.color },
  ];

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
        <ArmchairIcon className="w-3.5 h-3.5 text-nebula-cyan" /> Screen Summary
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {tiles.map((t, i) => (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center"
          >
            <p className="text-lg font-display font-semibold tabular-nums" style={{ color: t.color }}>{t.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{t.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScreenSummaryStats;
