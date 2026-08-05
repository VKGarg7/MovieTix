import React, { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { prefersReducedMotion } from "../../../lib/prefersReducedMotion";

const CountUp = ({ value, prefix = "", i = 0 }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
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
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
};

const KpiCard = ({ icon: Icon, label, value, prefix = "", changePct, sparklineData, sparklineKey, i = 0, tone = "primary", renderValue }) => {
  const hasChange = changePct !== null && changePct !== undefined && Number.isFinite(changePct);
  const isUp = hasChange && changePct >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="relative glass-panel p-5 overflow-hidden"
    >
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: tone === "primary" ? "#F84565" : "#6D5CFF" }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${tone === "primary" ? "bg-primary/10 border-primary/25 text-primary" : "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet"}`}>
          <Icon className="w-4 h-4" />
        </span>

        {hasChange && (
          <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-nebula-cyan" : "text-primary"}`}>
            {isUp ? <TrendingUpIcon className="w-3.5 h-3.5" /> : <TrendingDownIcon className="w-3.5 h-3.5" />}
            {Math.abs(changePct).toFixed(0)}%
          </span>
        )}
      </div>

      {renderValue ? (
        <div className="relative">{renderValue(value)}</div>
      ) : (
        <p className="text-2xl font-display font-medium relative tabular-nums">
          <CountUp value={value} prefix={prefix} i={i} />
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1 relative">{label}</p>

      {sparklineData && sparklineData.length > 1 && (
        <div className="h-8 mt-3 -mx-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey={sparklineKey}
                stroke={tone === "primary" ? "#F84565" : "#6D5CFF"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!prefersReducedMotion()}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default KpiCard;
