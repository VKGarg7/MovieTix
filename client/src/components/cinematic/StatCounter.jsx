import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const parseTarget = (label) => {
  const match = label.match(/^([\d,.]+)(K)?\+?/i);
  if (!match) return { value: 0, format: () => label };
  const raw = parseFloat(match[1].replace(/,/g, ""));
  const isK = !!match[2];
  const target = isK ? raw * 1000 : raw;
  const suffix = label.slice(match[0].length);

  const format = (n) => {
    const rounded = isK ? Math.round(n / 1000) : Math.round(n);
    const display = isK ? `${rounded}K` : rounded.toLocaleString();
    return `${display}${suffix}`;
  };

  return { value: target, format };
};

const StatCounter = ({ label, i = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { value, format } = parseTarget(label);
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <p className="font-display text-3xl md:text-4xl font-medium gradient-text tabular-nums">{display}</p>
      <p className="mt-1 text-xs md:text-sm text-gray-400 tracking-wide">{label.replace(/^[\d,.]+K?\+?/i, "").trim()}</p>
    </motion.div>
  );
};

export default StatCounter;
