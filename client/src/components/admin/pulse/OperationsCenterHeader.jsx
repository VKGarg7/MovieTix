import React from "react";
import { motion } from "framer-motion";
import { RadioIcon, RefreshCwIcon, DownloadIcon, Maximize2Icon } from "lucide-react";

const OperationsCenterHeader = ({ autoRefresh, onToggleAutoRefresh, onRefreshNow, onExport, onFullscreen }) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium">Cinema Operations Center</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor live occupancy, bookings, revenue and screen health across all multiplexes.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onToggleAutoRefresh}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            autoRefresh ? "btn-glow bg-primary text-white" : "border border-white/15 text-gray-300 hover:bg-white/5"
          }`}
        >
          <RadioIcon className="w-3.5 h-3.5" /> Auto Refresh {autoRefresh ? "(Live)" : "(Off)"}
        </motion.button>
        {[
          { label: "Refresh Now", icon: RefreshCwIcon, onClick: onRefreshNow },
          { label: "Export", icon: DownloadIcon, onClick: onExport },
          { label: "Fullscreen", icon: Maximize2Icon, onClick: onFullscreen },
        ].map(({ label, icon: Icon, onClick }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-white/15 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default OperationsCenterHeader;
