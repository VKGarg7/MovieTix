import React, { useEffect, useRef } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 47.3) % 100}%`,
  top: `${(i * 29.7) % 100}%`,
  size: 1 + ((i * 13) % 3) * 0.5,
  delay: (i % 10) * 0.4,
  duration: 3 + (i % 4),
}));

const DUST = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 61.8) % 100}%`,
  size: 2 + ((i * 5) % 3),
  delay: (i % 8) * 0.7,
  duration: 12 + (i % 6) * 2,
}));

const FooterAmbience = () => {
  const ref = useRef(null);
  const reduced = useRef(prefersReducedMotion());
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 30, damping: 22 });
  const sy = useSpring(my, { stiffness: 30, damping: 22 });
  const parallaxX = useTransform(sx, (v) => (v - 50) * -0.4);
  const parallaxY = useTransform(sy, (v) => (v - 50) * -0.25);

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
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-[#0a0a10] to-black" />
      <div className="absolute -top-32 left-0 right-0 h-64 bg-gradient-to-b from-void to-transparent" />

      <motion.div
        style={reduced.current ? undefined : { x: parallaxX, y: parallaxY }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-1/4 left-[15%] w-[38rem] h-[38rem] rounded-full blur-[100px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(109,92,255,0.35), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-[10%] w-[32rem] h-[32rem] rounded-full blur-[100px] opacity-20"
          style={{ background: "radial-gradient(circle, rgba(63,216,224,0.3), transparent 70%)" }}
        />
      </motion.div>

      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
        style={{ background: "linear-gradient(to top, rgba(20,20,30,0.6), transparent)" }}
      />

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[70%] opacity-[0.07]"
        style={{
          background: "conic-gradient(from 180deg at 50% 100%, transparent 40%, rgba(255,255,255,0.9) 50%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {!reduced.current &&
        STARS.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
            animate={{ opacity: [0.15, 0.8, 0.15] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {!reduced.current &&
        DUST.map((d) => (
          <motion.span
            key={`dust-${d.id}`}
            className="absolute rounded-full bg-white/30"
            style={{ left: d.left, width: d.size, height: d.size, bottom: -10 }}
            animate={{ y: [0, -260], opacity: [0, 0.5, 0] }}
            transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
    </div>
  );
};

export default FooterAmbience;
