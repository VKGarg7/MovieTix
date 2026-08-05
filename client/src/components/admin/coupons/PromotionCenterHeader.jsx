import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusIcon, DownloadIcon, BarChart3Icon, RefreshCwIcon } from "lucide-react";

const PromotionCenterHeader = ({ onCreate, onExport, onRefresh, refreshing }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Create Coupon", icon: PlusIcon, onClick: onCreate, primary: true },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
    { label: "Refresh", icon: RefreshCwIcon, onClick: onRefresh, busy: refreshing },
  ];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium flex items-center gap-2">
          <span>🎟</span> Promotion Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">Create, monitor and optimize discount campaigns across every theater.</p>
      </div>

      <div className="flex items-center gap-2">
        {buttons.map(({ label, icon: Icon, onClick, primary, busy }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            disabled={busy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              primary ? "btn-glow bg-primary text-white" : "border border-white/15 text-gray-300 hover:bg-white/5"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PromotionCenterHeader;
