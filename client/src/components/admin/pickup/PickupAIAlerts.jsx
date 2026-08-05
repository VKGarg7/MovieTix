import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

const TONE_STYLES = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  amber: "bg-nebula-amber/10 border-nebula-amber/25 text-nebula-amber",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
};

const PickupAIAlerts = ({ recentPickups }) => {
  const alerts = useMemo(() => {
    const list = [];
    const longWait = recentPickups.some((p) => (p.waitSeconds || 0) > 15 * 60);
    if (longWait) list.push({ label: "Customer waiting over 15 minutes", tone: "primary" });

    if (recentPickups.length >= 2) {
      const [latest, prev] = recentPickups;
      const gap = (new Date(latest.verifiedAt).getTime() - new Date(prev.verifiedAt).getTime()) / 60000;
      if (gap > 10) list.push({ label: "Pickup delay detected between recent orders", tone: "amber" });
    }

    const popcornCount = recentPickups.filter((p) => p.items?.some((i) => i.toLowerCase().includes("popcorn"))).length;
    if (popcornCount >= 3) list.push({ label: "Popular item running low — Popcorn", tone: "violet" });

    if (list.length === 0) list.push({ label: "All pickups on track — no alerts", tone: "violet" });
    return list;
  }, [recentPickups]);

  return (
    <div className="glass-panel !rounded-2xl p-4 space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300"><SparklesIcon className="w-3.5 h-3.5 text-nebula-violet" /> AI Alerts</p>
      {alerts.map((a, idx) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06 }}
          className={`px-3 py-2 rounded-xl text-[11px] border ${TONE_STYLES[a.tone]}`}
        >
          {a.label}
        </motion.div>
      ))}
    </div>
  );
};

export default PickupAIAlerts;
