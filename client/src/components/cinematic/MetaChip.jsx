import React from "react";
import { motion } from "framer-motion";

const MetaChip = ({ icon: Icon, children, i = 0, tone = "default" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.25)" }}
    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs border backdrop-blur-xl transition-colors ${
      tone === "amber"
        ? "border-nebula-amber/30 bg-nebula-amber/10 text-nebula-amber"
        : tone === "cyan"
        ? "border-nebula-cyan/30 bg-nebula-cyan/10 text-nebula-cyan"
        : tone === "violet"
        ? "border-nebula-violet/30 bg-nebula-violet/10 text-nebula-violet"
        : "border-white/10 bg-white/[0.05] text-gray-300"
    }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {children}
  </motion.div>
);

export default MetaChip;
