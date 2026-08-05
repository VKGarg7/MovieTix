import React from "react";
import { motion } from "framer-motion";
import { StarIcon } from "lucide-react";

const CircularRating = ({ value, size = 52, className = "" }) => {
  const pct = Math.max(0, Math.min(1, value / 10));
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  const color = value >= 7.5 ? "#3FD8E0" : value >= 5.5 ? "#FFB86B" : "#F84565";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 ${className}`}
      style={{ width: size, height: size, boxShadow: `0 0 16px -2px ${color}99` }}
    >
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
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="text-xs font-semibold">{value.toFixed(1)}</span>
        <StarIcon className="w-2.5 h-2.5 mt-0.5" style={{ color, fill: color }} />
      </div>
    </div>
  );
};

export default CircularRating;
