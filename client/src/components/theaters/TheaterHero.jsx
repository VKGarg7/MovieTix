import React, { useEffect, useMemo, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useRef } from "react";
import { Volume2Icon, MonitorPlayIcon, SofaIcon } from "lucide-react";
import { AMENITIES } from "../../lib/theaterPresentation";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const FORMAT_ICONS = { dolby: Volume2Icon, imax: MonitorPlayIcon, recliner: SofaIcon };

const CountUp = ({ value, i = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      delay: 0.15 + i * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
};
const TheaterHero = ({ theaters, selectedCity }) => {
  const cityCount = useMemo(() => new Set(theaters.map((t) => t.city)).size, [theaters]);
  const formats = AMENITIES.filter((a) => FORMAT_ICONS[a.key]);

  return (
    <div className="relative mb-16">
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="section-eyebrow mb-3"
      >
        Our Destinations
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-4xl md:text-6xl font-medium leading-[1.05]"
      >
        {selectedCity ? (
          <>
            Theaters in <span className="gradient-text">{selectedCity}</span>
          </>
        ) : (
          "Our Theaters"
        )}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 text-gray-400 font-light text-lg max-w-xl"
      >
        Every screen, every seat, chosen for how it makes the story feel bigger.
      </motion.p>

      <div className="flex flex-wrap items-center gap-8 mt-8">
        <div>
          <p className="font-display text-3xl font-medium gradient-text tabular-nums">
            <CountUp value={theaters.length} i={0} />
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Theaters</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div>
          <p className="font-display text-3xl font-medium gradient-text tabular-nums">
            <CountUp value={cityCount} i={1} />
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Cities</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap gap-2.5 mt-8"
      >
        {formats.map((f) => {
          const Icon = FORMAT_ICONS[f.key];
          return (
            <span
              key={f.key}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs border border-white/10 bg-white/[0.04] backdrop-blur-xl text-gray-300"
            >
              <Icon className="w-3.5 h-3.5 text-nebula-cyan" />
              {f.label}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
};

export default TheaterHero;
