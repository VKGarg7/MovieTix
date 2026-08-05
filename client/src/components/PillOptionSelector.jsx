import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_PILL } from "../lib/motion";

const Pill = ({ option, selected, renderLabel, circular, multiple, onChange }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onChange(option);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ y: -3, scale: multiple ? 1.05 : 1.06 }}
      whileTap={{ scale: multiple ? 0.95 : 0.92 }}
      transition={SPRING_PILL}
      className={`relative overflow-hidden ${circular ? "w-7 h-7 rounded-full" : `${multiple ? "px-3.5" : "px-3"} py-1.5 rounded-full`} text-xs cursor-pointer text-white border`}
      style={{
        background: selected
          ? "linear-gradient(120deg, #F84565, #FFB86B 45%, #6D5CFF 100%)"
          : "rgba(255,255,255,0.04)",
        borderColor: selected ? "transparent" : "rgba(255,255,255,0.12)",
        boxShadow: selected ? "0 0 22px -4px rgba(248,69,101,0.75), 0 4px 14px -4px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <span className="relative z-10">{renderLabel ? renderLabel(option) : option}</span>

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

const PillOptionSelector = ({ options, value, onChange, renderLabel, circular = false, multiple = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const selected = multiple ? value.includes(option) : value === option;
      return (
        <Pill
          key={option}
          option={option}
          selected={selected}
          renderLabel={renderLabel}
          circular={circular}
          multiple={multiple}
          onChange={onChange}
        />
      );
    })}
  </div>
);

export default PillOptionSelector;
