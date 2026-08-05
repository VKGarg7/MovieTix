import React from "react";
import { motion } from "framer-motion";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";

const FailedQrCard = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 flex items-start gap-3"
  >
    <motion.span
      animate={{ rotate: [0, -8, 8, -8, 0] }}
      transition={{ duration: 0.5 }}
      className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 border border-primary/30 text-primary shrink-0"
    >
      <AlertTriangleIcon className="w-4.5 h-4.5" />
    </motion.span>
    <div className="flex-1">
      <p className="text-sm font-medium text-primary">QR not recognized</p>
      <p className="text-xs text-gray-400 mt-0.5">{message || "Try again, or use manual verification below."}</p>
    </div>
    <button onClick={onRetry} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-white/10 text-gray-300 hover:bg-white/5 cursor-pointer shrink-0">
      <RotateCcwIcon className="w-3.5 h-3.5" /> Retry
    </button>
  </motion.div>
);

export default FailedQrCard;
