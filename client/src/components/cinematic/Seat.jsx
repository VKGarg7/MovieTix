import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSeatSelect } from "../../lib/soundEngine";
import { SEAT_LIGHTING } from "../../lib/seatLighting";

const Seat = ({ seatId, seatType, selected, disabled, Icon, isAccessible, onClick, onFocus, onMouseEnter, buttonRef, tabIndex, ariaLabel, ariaSelected, onKeyDown, extraClass }) => {
  const [ripples, setRipples] = useState([]);
  const lighting = SEAT_LIGHTING[seatType] || SEAT_LIGHTING.regular;

  const handleClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    playSeatSelect(!selected);
    onClick();
  };

  return (
    <motion.button
      ref={buttonRef}
      role="gridcell"
      type="button"
      tabIndex={tabIndex}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-selected={ariaSelected}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      title={ariaLabel}
      whileHover={!disabled ? { y: -4, scale: 1.08 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      animate={selected ? { y: -3 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
      className={`relative h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center text-[10px] overflow-hidden
        cursor-pointer disabled:cursor-not-allowed
        ${disabled ? "opacity-30 grayscale border-white/10 bg-white/[0.02]" : lighting.border}
        ${selected ? "text-white bg-primary" : "bg-white/[0.04] text-gray-300"}
        ${extraClass || ""}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
      style={
        !disabled
          ? {
              boxShadow: selected
                ? `0 0 18px 2px ${lighting.selectedGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`
                : `0 0 8px -2px ${lighting.glow}`,
            }
          : undefined
      }
    >
      {seatId}
      {Icon && (
        <Icon
          aria-hidden="true"
          className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#0B0B10] rounded-full p-0.5 box-content border border-white/10 ${isAccessible ? "text-sky-300" : ""}`}
        />
      )}

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.6, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: r.x,
              top: r.y,
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              background: selected ? "rgba(255,255,255,0.8)" : lighting.selectedGlow,
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

export default Seat;
