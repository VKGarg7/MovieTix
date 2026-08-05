import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, [data-cursor='hover']";

const CustomCursor = () => {
  const [isTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.5 });

  const trailRef = useRef([]);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    if (isTouch) return;

    document.documentElement.classList.add("custom-cursor-active");
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      trailRef.current = [{ x: e.clientX, y: e.clientY, id: Date.now() + Math.random() }, ...trailRef.current].slice(0, 6);
      setTrail(trailRef.current);

      const target = e.target;
      setHovering(!!target.closest?.(INTERACTIVE_SELECTOR));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <div className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      {trail.map((p, i) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-primary/40"
          style={{
            left: p.x,
            top: p.y,
            width: 5 - i * 0.5,
            height: 5 - i * 0.5,
            marginLeft: -(5 - i * 0.5) / 2,
            marginTop: -(5 - i * 0.5) / 2,
            opacity: (1 - i / trail.length) * 0.35,
          }}
        />
      ))}

      <motion.div
        className="absolute rounded-full border"
        style={{
          left: ringX,
          top: ringY,
          x: "-50%",
          y: "-50%",
          borderColor: hovering ? "rgba(248,69,101,0.7)" : "rgba(255,255,255,0.35)",
          background: hovering ? "rgba(248,69,101,0.12)" : "transparent",
          boxShadow: hovering ? "0 0 24px -4px rgba(248,69,101,0.7)" : "none",
        }}
        animate={{
          width: hovering ? 52 : pressed ? 20 : 32,
          height: hovering ? 52 : pressed ? 20 : 32,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />

      <motion.div
        className="absolute rounded-full bg-white"
        style={{ left: x, top: y, x: "-50%", y: "-50%" }}
        animate={{ width: hovering ? 0 : 6, height: hovering ? 0 : 6, opacity: hovering ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </div>
  );
};

export default CustomCursor;
