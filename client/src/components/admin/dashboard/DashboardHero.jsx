import React from "react";
import { motion } from "framer-motion";

const DashboardHero = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="relative mb-8"
  >
    <div className="flex items-center gap-2.5 mb-2">
      <h1 className="font-display text-3xl md:text-4xl font-medium">
        MovieTix <span className="gradient-text">Control Center</span>
      </h1>
      <span className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-nebula-cyan/10 border border-nebula-cyan/30 text-nebula-cyan">
        <span className="relative w-1.5 h-1.5 rounded-full bg-nebula-cyan">
          <motion.span
            className="absolute inset-0 rounded-full bg-nebula-cyan"
            animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </span>
        LIVE
      </span>
    </div>
    <p className="text-gray-400 font-light text-sm md:text-base max-w-xl">
      Real-time bookings, occupancy, and revenue across your cinema operations.
    </p>
  </motion.div>
);

export default DashboardHero;
