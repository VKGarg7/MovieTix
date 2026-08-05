import React from "react";
import { motion } from "framer-motion";

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekScheduler = ({ selectedDays, onToggle }) => (
  <div className="grid grid-cols-7 gap-1.5">
    {DAY_LABELS.map((label, day) => {
      const active = selectedDays.includes(day);
      return (
        <motion.button
          key={day}
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onToggle(day)}
          className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
            active
              ? "border-primary/40 bg-primary/15 text-white"
              : "border-white/10 bg-white/[0.02] text-gray-500 hover:bg-white/5"
          }`}
          style={active ? { boxShadow: "0 0 16px -2px rgba(248,69,101,0.6)" } : undefined}
        >
          {label}
        </motion.button>
      );
    })}
  </div>
);

export default WeekScheduler;
