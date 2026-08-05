import React, { useEffect, useRef } from "react";
import { useMotionValue, motion, useSpring, useMotionTemplate } from "framer-motion";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const FLECKS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 137.5) % 100}%`,
  size: 2 + ((i * 7) % 4),
  delay: (i % 7) * 0.6,
  duration: 9 + (i % 5) * 2,
}));

const CinemaAmbience = () => {
  const ref = useRef(null);
  const reduced = useRef(prefersReducedMotion());
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgba(255,255,255,0.05), transparent 60%)`;

  useEffect(() => {
    if (reduced.current) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      mx.set(((e.clientX - rect.left) / rect.width) * 100);
      my.set(((e.clientY - rect.top) / rect.height) * 100);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[40px]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

      {!reduced.current && (
        <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      )}

      <div
        className="absolute top-10 right-[15%] w-72 h-72 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, rgba(255,184,107,0.35), transparent 70%)" }}
      />
      <div
        className="absolute bottom-10 left-[10%] w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, rgba(63,216,224,0.25), transparent 70%)" }}
      />

      {!reduced.current &&
        FLECKS.map((f) => (
          <motion.span
            key={f.id}
            className="absolute rounded-full bg-white/40"
            style={{ left: f.left, width: f.size, height: f.size, bottom: -10 }}
            animate={{ y: [0, -420], opacity: [0, 0.6, 0] }}
            transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
    </div>
  );
};

export default CinemaAmbience;
