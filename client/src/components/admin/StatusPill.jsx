import React from "react";
import { motion } from "framer-motion";
import { getToneStyle } from "../../lib/statusPillStyles";

// variant: "dot" (glowing pulse dot), "icon" (lucide icon, no pulse), "emoji" (emoji glyph, mount-fade only),
// "plain" (no dot/icon, raw className passed via `cls` — for one-off tones outside the shared token set)
const StatusPill = ({
  label,
  tone,
  variant = "dot",
  pulse = false,
  icon: Icon,
  emoji,
  cls,
  textSize = "text-[10px]",
  gap = "gap-1.5",
  pulseDuration = 1.6,
  glow = true,
}) => {
  const style = getToneStyle(tone);

  if (variant === "plain") {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${textSize} font-semibold border backdrop-blur-md ${cls}`}>
        {label}
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${textSize} font-semibold border backdrop-blur-md ${style.cls}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
    );
  }

  if (variant === "emoji") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center ${gap} px-2.5 py-1 rounded-full ${textSize} font-semibold border backdrop-blur-md ${style.cls}`}
      >
        <span>{emoji}</span>
        {label}
      </motion.span>
    );
  }

  return (
    <span className={`inline-flex items-center ${gap} px-2.5 py-1 rounded-full ${textSize} font-semibold border backdrop-blur-md ${style.cls}`}>
      <motion.span
        className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
        style={glow ? { boxShadow: style.glow } : undefined}
        animate={pulse ? { opacity: [1, 0.4, 1] } : {}}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      {label}
    </span>
  );
};

export default StatusPill;
