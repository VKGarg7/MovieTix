import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon, InfoIcon } from "lucide-react";
import { useAppContext } from "../../../context/useAppContext";

const dayOfWeekMatches = (rule, isoDate, time) => {
  const [h] = time.split(":").map(Number);
  const weekday = new Date(`${isoDate}T00:00:00`).getDay();
  return (rule.daysOfWeek || []).includes(weekday) && h >= rule.startHour && h < rule.endHour;
};

const PricingPanel = ({ showPrice, onPriceChange, theaterId, dateTimeSelection, currency }) => {
  const { axios, getToken } = useAppContext();
  const [rules, setRules] = useState([]);

  useEffect(() => {
    if (!theaterId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get("/api/pricing-rule", {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && data.success) {
          setRules(data.rules.filter((r) => r.isActive && (r.theaterId === null || r.theaterId === theaterId)));
        }
      } catch (error) {
        console.error("Failed to load pricing rules:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theaterId, axios, getToken]);

  const applicableTimeRules = useMemo(() => {
    const base = Number(showPrice) || 0;
    const matches = [];
    for (const [date, times] of Object.entries(dateTimeSelection)) {
      for (const time of times) {
        for (const rule of rules.filter((r) => r.type === "time_of_week")) {
          if (dayOfWeekMatches(rule, date, time)) {
            matches.push({ rule, date, time, adjustedPrice: Math.round((base + base * (rule.adjustmentPercent / 100)) * 100) / 100 });
          }
        }
      }
    }
    return matches;
  }, [rules, dateTimeSelection, showPrice]);

  const earlyBirdRules = rules.filter((r) => r.type === "early_bird");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Base Show Price</label>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-gray-400 text-sm">{currency}</span>
          <input
            type="number"
            min={0}
            value={showPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {rules.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <InfoIcon className="w-3.5 h-3.5" /> No active pricing rules for this theater — the base price applies as-is.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Active pricing rules that will apply to these screenings</p>

          {applicableTimeRules.length > 0 && (
            <div className="space-y-1.5">
              {applicableTimeRules.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-xs"
                >
                  <span className="flex items-center gap-1.5 text-gray-300">
                    {m.rule.adjustmentPercent >= 0 ? (
                      <TrendingUpIcon className="w-3.5 h-3.5 text-nebula-cyan" />
                    ) : (
                      <TrendingDownIcon className="w-3.5 h-3.5 text-primary" />
                    )}
                    {m.rule.name} · {m.date} {m.time}
                  </span>
                  <span className="font-medium">
                    {currency}
                    {m.adjustedPrice} <span className="text-gray-500">({m.rule.adjustmentPercent > 0 ? "+" : ""}{m.rule.adjustmentPercent}%)</span>
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {earlyBirdRules.length > 0 && (
            <p className="text-[11px] text-gray-500 px-1">
              {earlyBirdRules.length} early-bird rule{earlyBirdRules.length === 1 ? "" : "s"} also active — applies automatically based on how far in advance a customer books.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PricingPanel;
