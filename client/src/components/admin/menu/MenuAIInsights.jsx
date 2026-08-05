import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";
import { getMenuInsights } from "../../../lib/menuItemStatus";

const TONE_STYLES = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  cyan: "bg-nebula-cyan/10 border-nebula-cyan/25 text-nebula-cyan",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
};

const MenuAIInsights = ({ items }) => {
  const insights = useMemo(() => {
    const all = items.flatMap((item) => getMenuInsights(item));
    return all.slice(0, 6);
  }, [items]);

  if (insights.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-panel !rounded-2xl p-4 space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300"><SparklesIcon className="w-3.5 h-3.5 text-nebula-violet" /> AI Insights</p>
      {insights.map((ins, idx) => (
        <motion.div
          key={`${ins.label}-${idx}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06 }}
          className={`px-3 py-2 rounded-xl text-[11px] border ${TONE_STYLES[ins.tone] || TONE_STYLES.violet}`}
        >
          {ins.label}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MenuAIInsights;
