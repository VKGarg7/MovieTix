import React from "react";
import { motion } from "framer-motion";

const ActivitySkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.05 }}
        className="h-14 rounded-xl border border-white/10 bg-white/[0.02]"
      />
    ))}
  </div>
);

export default ActivitySkeleton;
