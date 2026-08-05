import React from "react";
import { motion } from "framer-motion";
import { EyeIcon } from "lucide-react";
import { SEAT_TYPE_META } from "../../../lib/seatLayoutBuilder";

const MAX_SEATS_PER_ROW = 16;

const SeatMapLivePreview = ({ rows, screenName }) => {
  const hasSeats = rows.some((r) => Number(r.seatCount) > 0);

  return (
    <div className="glass-panel !rounded-3xl p-5 sticky top-20">
      <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-4"><EyeIcon className="w-3.5 h-3.5" /> Live Preview</p>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-nebula-violet/50 via-nebula-cyan/50 to-nebula-violet/50 mb-1" />
        <p className="text-center text-[10px] text-gray-500 mb-4">SCREEN</p>

        {!hasSeats ? (
          <p className="text-xs text-gray-500 text-center py-8">Add rows to preview the seat map</p>
        ) : (
          <div className="space-y-1.5">
            {rows.map((row, idx) => {
              const meta = SEAT_TYPE_META[row.seatType] || SEAT_TYPE_META.regular;
              const count = Math.min(Number(row.seatCount) || 0, MAX_SEATS_PER_ROW);
              const overflow = (Number(row.seatCount) || 0) - count;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="w-4 text-[10px] text-gray-500 shrink-0">{row.label || "?"}</span>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: count }).map((_, i) => (
                      <span key={i} className="w-3 h-3 rounded-[3px]" style={{ background: meta.color }} />
                    ))}
                    {overflow > 0 && <span className="text-[9px] text-gray-600">+{overflow}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {screenName && <p className="text-center text-xs text-gray-400 mt-3">{screenName}</p>}
    </div>
  );
};

export default SeatMapLivePreview;
