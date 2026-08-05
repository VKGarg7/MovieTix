import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SocialButton = ({ icon: Icon, label, href = "#" }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * 0.3, y: y * 0.3 });
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={handleClick}
      animate={{ x: offset.x, y: offset.y }}
      whileHover={{ scale: 1.1, y: offset.y - 3 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden text-gray-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer shadow-[0_0_0_0_rgba(248,69,101,0)] hover:shadow-[0_0_24px_-4px_rgba(248,69,101,0.6)]"
    >
      <Icon className="w-4 h-4" strokeWidth={1.8} />
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.45, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none bg-white"
            style={{ left: r.x, top: r.y, width: 8, height: 8, marginLeft: -4, marginTop: -4 }}
          />
        ))}
      </AnimatePresence>
    </motion.a>
  );
};

export default SocialButton;
