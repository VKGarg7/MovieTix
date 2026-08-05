import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrophyIcon } from "lucide-react";

const MEDAL_COLORS = ["text-nebula-amber", "text-gray-300", "text-primary"];

const TopSellersCarousel = ({ items, currency }) => {
  const top = useMemo(() => [...items].filter((i) => i.isAvailable).sort((a, b) => b.price - a.price).slice(0, 5), [items]);

  if (top.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3"><TrophyIcon className="w-3.5 h-3.5 text-nebula-amber" /> Top Sellers</p>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {top.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 w-32 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${MEDAL_COLORS[idx] || "text-gray-500"}`}>#{idx + 1}</span>
            </div>
            <p className="text-xs font-medium truncate">{item.name}</p>
            <p className="text-[11px] text-nebula-cyan mt-0.5">{currency}{item.price}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TopSellersCarousel;
