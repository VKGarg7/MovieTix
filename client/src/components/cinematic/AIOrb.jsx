import React from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  angle: (i / 6) * 360,
  delay: i * 0.35,
}));

const AIOrb = ({ size = 40, active = false }) => {
  const reduced = prefersReducedMotion();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <motion.div
        className="absolute -inset-2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(109,92,255,0.45), transparent 70%)" }}
        animate={reduced ? {} : { scale: active ? [1, 1.3, 1] : [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: active ? 1.4 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #6D5CFF, #3FD8E0, #F84565, #FFB86B, #6D5CFF)",
        }}
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: active ? 3 : 8, repeat: Infinity, ease: "linear" }}
      />

      <div
        className="absolute inset-[3px] rounded-full backdrop-blur-md"
        style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(20,20,30,0.85) 60%)" }}
      />

      {!reduced &&
        active &&
        PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-white"
            style={{ boxShadow: "0 0 6px 1px rgba(255,255,255,0.9)" }}
            animate={{
              x: [0, Math.cos((p.angle * Math.PI) / 180) * size * 0.9],
              y: [0, Math.sin((p.angle * Math.PI) / 180) * size * 0.9],
              opacity: [0.9, 0],
              scale: [1, 0.3],
            }}
            transition={{ duration: 1.2, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
    </div>
  );
};

export default AIOrb;
