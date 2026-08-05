import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";
import { buildOperationsAlerts } from "../../../lib/pulseStatus";

const TONE_STYLES = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  amber: "bg-nebula-amber/10 border-nebula-amber/25 text-nebula-amber",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
};

const OperationsAIAlerts = ({ shows, now }) => {
  const alerts = useMemo(() => buildOperationsAlerts(shows, now), [shows, now]);

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

export default OperationsAIAlerts;
