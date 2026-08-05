import React from "react";
import { motion } from "framer-motion";
import { TicketIcon } from "lucide-react";

const THEME_GRADIENTS = {
  sunset: "linear-gradient(135deg, #F84565 0%, #FFB86B 100%)",
  ocean: "linear-gradient(135deg, #3FD8E0 0%, #6D5CFF 100%)",
  violet: "linear-gradient(135deg, #6D5CFF 0%, #F84565 100%)",
};

const formatDiscount = (type, value) => {
  if (!value) return "—";
  switch (type) {
    case "percent": return `${value}% OFF`;
    case "flat": return `Flat ₹${value} OFF`;
    case "bogo": return "Buy 1 Get 1";
    case "cashback": return `₹${value} Cashback`;
    default: return `${value}`;
  }
};

const LiveCouponPreview = ({ form }) => {
  const gradient = THEME_GRADIENTS[form.theme] || THEME_GRADIENTS.sunset;
  const expiryLabel = form.expiryDate
    ? new Date(form.expiryDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-20"
    >
      <p className="text-xs text-gray-500 mb-3">Live Preview</p>

      <div className="relative rounded-3xl overflow-hidden" style={{ background: gradient }}>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay noise-overlay" />
        <motion.div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/20 blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-md border border-white/30">
              <TicketIcon className="w-3 h-3" /> MOVIETIX PROMO
            </span>
            {form.autoApply && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/15 border border-white/25">AUTO</span>
            )}
          </div>

          <p className="font-display text-3xl font-semibold tracking-wide mb-1 break-all">{form.code || "SAVE20"}</p>
          <p className="text-lg font-medium opacity-95">{formatDiscount(form.type, form.value)}</p>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-white/30">
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wide">Valid until</p>
              <p className="text-sm font-medium">{expiryLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-70 uppercase tracking-wide">Limit</p>
              <p className="text-sm font-medium">{form.usageLimit || "—"} uses</p>
            </div>
          </div>

          <div className="flex items-end gap-[2px] mt-5 h-8 opacity-90">
            {Array.from({ length: 38 }).map((_, i) => (
              <motion.span
                key={i}
                className="bg-white/90 rounded-[1px]"
                style={{ width: (i % 5 === 0) ? 2 : 1, height: `${20 + ((i * 37) % 60)}%` }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, delay: i * 0.03, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>

        <div className="absolute left-0 right-0 -bottom-3 flex justify-between px-4">
          <span className="w-6 h-6 rounded-full bg-[#0B0B10]" />
          <span className="w-6 h-6 rounded-full bg-[#0B0B10]" />
        </div>
      </div>
    </motion.div>
  );
};

export default LiveCouponPreview;
