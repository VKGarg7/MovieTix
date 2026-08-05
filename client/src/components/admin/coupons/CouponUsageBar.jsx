import React from "react";
import { motion } from "framer-motion";

const usageTone = (pct) => {
  if (pct >= 75) return { text: "text-nebula-cyan", bar: "from-nebula-cyan to-nebula-violet" };
  if (pct >= 40) return { text: "text-nebula-amber", bar: "from-nebula-amber to-primary" };
  return { text: "text-primary", bar: "from-primary to-primary-dull" };
};

const CouponUsageBar = ({ used, limit }) => {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = usageTone(pct);

  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className={`font-semibold tabular-nums ${tone.text}`}>{pct}%</span>
        <span className="text-gray-500 tabular-nums">{used} of {limit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5">{used} redeemed</p>
    </div>
  );
};

export default CouponUsageBar;
