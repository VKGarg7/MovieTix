import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CrownIcon, Volume2Icon, MonitorPlayIcon, PopcornIcon, CarIcon, SofaIcon, LocateFixedIcon } from "lucide-react";

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "imax", label: "IMAX", icon: MonitorPlayIcon },
  { key: "dolby", label: "Dolby", icon: Volume2Icon },
  { key: "recliner", label: "Recliner", icon: SofaIcon },
  { key: "nearby", label: "Nearby", icon: LocateFixedIcon },
  { key: "premium", label: "Premium", icon: CrownIcon },
  { key: "parking", label: "Parking", icon: CarIcon },
  { key: "foodCourt", label: "Food Court", icon: PopcornIcon },
];

const Chip = ({ filter, active, onClick, locating }) => {
  const [ripples, setRipples] = useState([]);
  const Icon = filter.icon;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onClick(filter.key);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -3, scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border cursor-pointer text-white"
      style={{
        background: active ? "linear-gradient(120deg, #F84565, #FFB86B 45%, #6D5CFF 100%)" : "rgba(255,255,255,0.04)",
        borderColor: active ? "transparent" : "rgba(255,255,255,0.12)",
        boxShadow: active ? "0 0 22px -4px rgba(248,69,101,0.75), 0 4px 14px -4px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {Icon && (
        <motion.span animate={locating && filter.key === "nearby" ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: locating ? Infinity : 0, ease: "linear" }}>
          <Icon className="w-3.5 h-3.5 relative z-10" />
        </motion.span>
      )}
      <span className="relative z-10">{filter.label}</span>

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none bg-white"
            style={{ left: r.x, top: r.y, width: 8, height: 8, marginLeft: -4, marginTop: -4 }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

const TheaterFilterChips = ({ active, onChange, locating }) => (
  <div className="flex flex-wrap gap-2.5">
    {FILTERS.map((f) => (
      <Chip key={f.key} filter={f} active={active === f.key} onClick={onChange} locating={locating} />
    ))}
  </div>
);

export default TheaterFilterChips;
