import React from "react";
import { motion } from "framer-motion";
import { AppleIcon, PlayIcon } from "lucide-react";

const AppBadge = ({ store, href = "#" }) => {
  const isApple = store === "apple";
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden hover:border-white/25 hover:shadow-[0_0_30px_-8px_rgba(109,92,255,0.5)] transition-shadow cursor-pointer"
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="text-white/90"
      >
        {isApple ? <AppleIcon className="w-5 h-5" /> : <PlayIcon className="w-4 h-4 fill-white" />}
      </motion.span>
      <span className="leading-tight text-left">
        <span className="block text-[9px] uppercase tracking-wider text-gray-400">
          {isApple ? "Download on the" : "Get it on"}
        </span>
        <span className="block text-xs font-medium">{isApple ? "App Store" : "Google Play"}</span>
      </span>

      <span
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen"
        style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, transparent 60%)" }}
      />
    </motion.a>
  );
};

export default AppBadge;
