import React from "react";
import { motion } from "framer-motion";

// buttons: [{ label, icon, onClick, primary, active, busy, disabled }]
// - primary / active both render the filled "btn-glow bg-primary" style (primary = static CTA, active = toggle state)
// - busy spins the icon and disables the button; disabled alone just disables it
const PageHeader = ({ title, subtitle, emoji, buttons = [], wrap = true }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className={`font-display text-2xl md:text-3xl font-medium ${emoji ? "flex items-center gap-2" : ""}`}>
        {emoji && <span>{emoji}</span>} {title}
      </h1>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>

    <div className={`flex items-center gap-2 ${wrap ? "flex-wrap" : ""}`}>
      {buttons.map(({ label, icon: Icon, onClick, primary, active, busy, disabled }) => (
        <motion.button
          key={label}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          disabled={busy || disabled}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            primary || active ? "btn-glow bg-primary text-white" : "border border-white/15 text-gray-300 hover:bg-white/5"
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
          {label}
        </motion.button>
      ))}
    </div>
  </div>
);

export default PageHeader;
