import React from "react";
import { motion } from "framer-motion";
import { PlusIcon, UploadIcon, DownloadIcon, FlaskConicalIcon, HistoryIcon } from "lucide-react";

const RevenuePricingHeader = ({ onCreate, onImport, onExport, onSimulate, onHistory }) => {
  const buttons = [
    { label: "Create Rule", icon: PlusIcon, onClick: onCreate, primary: true },
    { label: "Import Rules", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Simulation", icon: FlaskConicalIcon, onClick: onSimulate },
    { label: "History", icon: HistoryIcon, onClick: onHistory },
  ];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium">Revenue Pricing Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Optimize ticket pricing dynamically across theaters, screens and showtimes.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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

export default RevenuePricingHeader;
