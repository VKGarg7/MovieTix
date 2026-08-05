import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RippleButton = ({ children, className = "", magnetStrength = 0.25, ...props }) => {
  const [ripples, setRipples] = useState([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * magnetStrength, y: y * magnetStrength });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    props.onClick?.(e);
  };

  return (
    <motion.button
      {...props}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`btn-glow relative overflow-hidden ${className}`}
    >
      {children}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none bg-white"
            style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

export default RippleButton;
