import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

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

const FavouriteHero = ({ movies }) => {
  const topGenres = useMemo(() => {
    const counts = new Map();
    movies.forEach((m) => m.genres?.forEach((g) => counts.set(g.name, (counts.get(g.name) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [movies]);

  return (
    <div className="relative mb-12">
      <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="section-eyebrow mb-3">
        Your Vault
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-4xl md:text-6xl font-medium leading-[1.05]"
      >
        Your Personal <span className="gradient-text">Collection</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 text-gray-400 font-light text-lg max-w-xl"
      >
        Every title you've marked to remember — curated by you, organized for you.
      </motion.p>

      <div className="flex flex-wrap items-center gap-8 mt-8">
        <div>
          <p className="font-display text-3xl font-medium gradient-text tabular-nums">
            <CountUp value={movies.length} i={0} />
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Saved Movies</p>
        </div>

        {topGenres.length > 0 && (
          <>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-sm font-medium">{topGenres.map(([name]) => name).join(", ")}</p>
              <p className="text-xs text-gray-400 mt-0.5">Favorite Genres</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavouriteHero;
