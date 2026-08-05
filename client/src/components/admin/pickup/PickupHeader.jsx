import React from "react";
import { motion } from "framer-motion";
import { HistoryIcon, SettingsIcon, RefreshCwIcon, Maximize2Icon } from "lucide-react";

const PickupHeader = ({ onHistory, onCameraSettings, onSwitchCamera, onFullscreen }) => {
  const buttons = [
    { label: "Verification History", icon: HistoryIcon, onClick: onHistory },
    { label: "Camera Settings", icon: SettingsIcon, onClick: onCameraSettings },
    { label: "Switch Camera", icon: RefreshCwIcon, onClick: onSwitchCamera },
    { label: "Fullscreen", icon: Maximize2Icon, onClick: onFullscreen },
  ];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium">Concession Pickup Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Scan customer QR codes or manually verify pickup codes.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {buttons.map(({ label, icon: Icon, onClick }) => (
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

export default PickupHeader;
