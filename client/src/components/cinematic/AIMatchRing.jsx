import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

const AIMatchRing = ({ percent, size = 48, className = "" }) => {
  const pct = Math.max(0, Math.min(1, percent / 100));
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = "#6D5CFF";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-nebula-violet/40 ${className}`}
      style={{ width: size, height: size, boxShadow: `0 0 20px -2px ${color}aa` }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 0 1px ${color}55` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={3} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="text-[11px] font-bold text-nebula-violet">{percent}%</span>
        <SparklesIcon className="w-2.5 h-2.5 mt-0.5 text-nebula-violet" />
      </div>
    </div>
  );
};

export default AIMatchRing;
