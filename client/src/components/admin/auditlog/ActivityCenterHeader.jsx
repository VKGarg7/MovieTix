import React from "react";
import { motion } from "framer-motion";
import { DownloadIcon, RefreshCwIcon, RadioIcon } from "lucide-react";

const ActivityCenterHeader = ({ onExport, onRefresh, autoRefresh, onToggleAutoRefresh, refreshing }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-medium">Activity Center</h1>
      <p className="text-sm text-gray-500 mt-1">Monitor every action performed across your cinema management platform.</p>
    </div>

    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={onToggleAutoRefresh}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
          autoRefresh ? "btn-glow bg-primary text-white" : "border border-white/15 text-gray-300 hover:bg-white/5"
        }`}
      >
        <RadioIcon className="w-3.5 h-3.5" /> Auto Refresh {autoRefresh ? "On" : "Off"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-white/15 text-gray-300 hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <RefreshCwIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={onExport}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-white/15 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <DownloadIcon className="w-3.5 h-3.5" /> Export CSV
      </motion.button>
    </div>
  </div>
);

export default ActivityCenterHeader;
