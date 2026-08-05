import React from "react";
import { motion } from "framer-motion";

const VARIANT_CLASS = {
  row: {
    base: "w-7 h-7 rounded-lg flex items-center justify-center border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
    normal: "border-white/10 text-gray-400 hover:text-white hover:bg-white/10",
    danger: "border-primary/25 text-primary hover:bg-primary/10",
  },
  card: {
    base: "w-8 h-8 rounded-lg flex items-center justify-center border backdrop-blur-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
    normal: "border-white/20 bg-black/50 text-gray-200 hover:bg-white/20",
    danger: "border-primary/40 bg-black/50 text-primary hover:bg-primary/20",
  },
};

const ActionIconButton = ({ icon: Icon, label, onClick, danger = false, disabled = false, variant = "row" }) => {
  const cls = VARIANT_CLASS[variant] || VARIANT_CLASS.row;

  return (
    <div className="relative group/tip">
      <motion.button
        whileHover={{ scale: 1.12, y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        disabled={disabled}
        className={`${cls.base} ${danger ? cls.danger : cls.normal}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.button>
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] bg-black/90 border border-white/10 text-gray-200 opacity-0 group-hover/tip:opacity-100 transition-opacity">
        {label}
      </span>
    </div>
  );
};

export default ActionIconButton;
