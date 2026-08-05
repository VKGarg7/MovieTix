import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

const AIBadge = ({ label = "AI Recommended · Based on Your Watch History" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium overflow-hidden"
    style={{ background: "rgba(109,92,255,0.1)", border: "1px solid rgba(109,92,255,0.35)" }}
  >
    <motion.div
      className="absolute inset-0"
      style={{ background: "conic-gradient(from 0deg, transparent, rgba(109,92,255,0.6), transparent 30%)" }}
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
    <div className="absolute inset-[1px] rounded-full bg-void/90" />
    <SparklesIcon className="w-3.5 h-3.5 text-nebula-violet relative" />
    <span className="relative text-nebula-violet">{label}</span>
  </motion.div>
);

export default AIBadge;
