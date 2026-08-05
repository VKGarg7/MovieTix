import React from "react";
import { motion } from "framer-motion";
import { MonitorPlayIcon, ArmchairIcon } from "lucide-react";

const ExistingScreensList = ({ screens }) => {
  if (screens.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
        <MonitorPlayIcon className="w-3.5 h-3.5 text-nebula-violet" /> Existing Screens
      </p>
      <div className="space-y-1.5">
        {screens.map((s, i) => (
          <motion.div
            key={s._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
          >
            <span className="text-gray-200">{s.name}</span>
            <span className="flex items-center gap-1 text-gray-500"><ArmchairIcon className="w-3 h-3" /> {s.totalCapacity}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExistingScreensList;
