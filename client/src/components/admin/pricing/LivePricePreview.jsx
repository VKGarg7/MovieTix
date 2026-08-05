import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

const BASE_PRICE = 250;
const PREMIUM_SEAT_SURCHARGE = 100;

const LivePricePreview = ({ form, currency }) => {
  const adjustmentPercent = Number(form.adjustmentPercent) || 0;
  const surcharge = Math.round(BASE_PRICE * (adjustmentPercent / 100));
  const withRule = BASE_PRICE + surcharge;
  const final = withRule + PREMIUM_SEAT_SURCHARGE;

  const lines = [
    { label: "Base Ticket", value: `${currency}${BASE_PRICE}` },
    {
      label: form.name || "Rule Adjustment",
      value: `${adjustmentPercent >= 0 ? "+" : ""}${adjustmentPercent}%`,
      tone: adjustmentPercent >= 0 ? "text-nebula-amber" : "text-nebula-cyan",
    },
    { label: "Premium Seat", value: `+${currency}${PREMIUM_SEAT_SURCHARGE}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-20"
    >
      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><SparklesIcon className="w-3.5 h-3.5" /> Live Price Preview</p>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-6 space-y-3">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{line.label}</span>
            <span className={`font-medium tabular-nums ${line.tone || "text-gray-200"}`}>{line.value}</span>
          </div>
        ))}

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Final Price</span>
          <motion.span
            key={final}
            initial={{ scale: 1.15, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl font-display font-semibold bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet bg-clip-text text-transparent"
          >
            {currency}{final.toLocaleString()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

export default LivePricePreview;
