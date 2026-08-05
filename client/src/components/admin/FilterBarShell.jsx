import React from "react";
import { motion } from "framer-motion";
import { RotateCcwIcon } from "lucide-react";

const FilterBarShell = ({ children, onReset, resultCount, resultLabel, className = "sticky top-0 z-20 -mx-1 px-1 py-3" }) => (
  <div className={className}>
    <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center gap-2">
      {children}

      {onReset && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <RotateCcwIcon className="w-3.5 h-3.5" /> Reset
        </motion.button>
      )}

      {typeof resultCount === "number" && resultLabel && (
        <span className="text-[11px] text-gray-500 ml-auto pl-2 whitespace-nowrap">
          {resultCount} {resultLabel}
        </span>
      )}
    </div>
  </div>
);

export default FilterBarShell;