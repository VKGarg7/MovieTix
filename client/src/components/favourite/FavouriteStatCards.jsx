import React, { useEffect, useMemo, useState } from "react";
import { motion, animate } from "framer-motion";
import { useRef } from "react";
import { BookmarkIcon, StarIcon, ClockIcon, DramaIcon } from "lucide-react";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const CountUp = ({ value, decimals = 0, i = 0 }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(decimals ? "0.0" : "0");

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value.toFixed(decimals));
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      delay: 0.1 + i * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{display}</span>;
};

const StatCard = ({ icon: Icon, label, value, decimals = 0, suffix = "", i, tone = "primary" }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -3 }}
    className="glass-panel p-5 relative overflow-hidden"
  >
    <div
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30"
      style={{ background: tone === "primary" ? "#F84565" : "#6D5CFF" }}
    />
    <Icon className={`w-5 h-5 mb-3 relative ${tone === "primary" ? "text-primary" : "text-nebula-violet"}`} />
    <p className="text-2xl font-display font-medium relative tabular-nums">
      {typeof value === "number" ? (
        <>
          <CountUp value={value} decimals={decimals} i={i} />
          {suffix}
        </>
      ) : (
        value
      )}
    </p>
    <p className="text-xs text-gray-400 mt-1 relative">{label}</p>
  </motion.div>
);

const FavouriteStatCards = ({ movies }) => {
  const stats = useMemo(() => {
    if (movies.length === 0) return { avgRating: 0, totalRuntimeHrs: 0, topGenre: "—" };

    const avgRating = movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / movies.length;
    const totalRuntimeMin = movies.reduce((sum, m) => sum + (m.runtime || 0), 0);

    const genreCounts = new Map();
    movies.forEach((m) => m.genres?.forEach((g) => genreCounts.set(g.name, (genreCounts.get(g.name) || 0) + 1)));
    const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { avgRating, totalRuntimeHrs: totalRuntimeMin / 60, topGenre };
  }, [movies]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
      <StatCard icon={BookmarkIcon} label="Saved Movies" value={movies.length} i={0} />
      <StatCard icon={StarIcon} label="Average Rating" value={stats.avgRating} decimals={1} i={1} tone="violet" />
      <StatCard icon={ClockIcon} label="Total Runtime" value={stats.totalRuntimeHrs} decimals={1} suffix="h" i={2} />
      <StatCard icon={DramaIcon} label="Favorite Genre" value={stats.topGenre} i={3} tone="violet" />
    </div>
  );
};

export default FavouriteStatCards;
