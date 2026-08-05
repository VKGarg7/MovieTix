import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusIcon, UploadIcon, DownloadIcon, PackageIcon, BarChart3Icon } from "lucide-react";

const ConcessionsHeader = ({ onAdd, onImport, onExport }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Add Item", icon: PlusIcon, onClick: onAdd, primary: true },
    { label: "Import Menu", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Inventory", icon: PackageIcon, onClick: onAdd },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
  ];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium">Concessions Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage food, beverages and combo offers across all theaters.</p>
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

export default ConcessionsHeader;
