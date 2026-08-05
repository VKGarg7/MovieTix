import React from "react";
import { motion } from "framer-motion";
import { PlusIcon, UploadIcon, DownloadIcon } from "lucide-react";

const InfrastructureHeader = ({ onNewTheater, onImport, onExport }) => {
  const buttons = [
    { label: "New Theater", icon: PlusIcon, onClick: onNewTheater, primary: true },
    { label: "Import", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
  ];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium">Cinema Infrastructure</h1>
        <p className="text-sm text-gray-500 mt-1">Manage multiplexes, screens, seating layouts and theater information.</p>
      </div>

      <div className="flex items-center gap-2">
        {buttons.map(({ label, icon: Icon, onClick, primary }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              primary ? "btn-glow bg-primary text-white" : "border border-white/15 text-gray-300 hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default InfrastructureHeader;
