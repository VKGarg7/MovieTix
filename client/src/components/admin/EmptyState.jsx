import React from "react";
import { motion } from "framer-motion";

const TONE_STYLES = {
  primary: {
    glow: "bg-primary",
    surface: "bg-primary/10 border-primary/25",
    icon: "text-primary",
  },
  violet: {
    glow: "bg-nebula-violet",
    surface: "bg-nebula-violet/10 border-nebula-violet/25",
    icon: "text-nebula-violet",
  },
};

const EmptyState = ({
  icon: Icon,
  tone = "primary",
  filtered = false,
  title,
  filteredTitle,
  description,
  filteredDescription,
  onPrimaryAction,
  primaryLabel,
  onReset,
  resetLabel = "Reset Filters",
  className = "glass-panel flex flex-col items-center justify-center text-center py-16 px-6",
  iconClassName = "w-20 h-20 rounded-2xl flex items-center justify-center",
  iconSizeClassName = "w-9 h-9",
  iconMotionProps,
  primaryButtonClassName = "btn-glow flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-white cursor-pointer",
  resetButtonClassName = "px-4 py-2 rounded-lg text-sm border border-white/15 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer",
}) => {
  const style = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <div className="relative mb-5">
        <div className={`absolute inset-0 blur-3xl opacity-30 rounded-full ${style.glow}`} />
        <motion.div
          animate={iconMotionProps?.animate}
          transition={iconMotionProps?.transition}
          className={`${iconClassName} ${style.surface}`}
        >
          <Icon className={`${iconSizeClassName} ${style.icon}`} />
        </motion.div>
      </div>

      <h3 className="font-display text-xl font-medium mb-1">{filtered ? filteredTitle || title : title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{filtered ? filteredDescription || description : description}</p>

      {filtered ? (
        onReset ? (
          <button onClick={onReset} className={resetButtonClassName}>
            {resetLabel}
          </button>
        ) : null
      ) : onPrimaryAction ? (
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onPrimaryAction} className={primaryButtonClassName}>
          {primaryLabel}
        </motion.button>
      ) : null}
    </motion.div>
  );
};

export default EmptyState;