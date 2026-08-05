import React from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";

const StepNav = ({ onBack, onContinue, continueLabel = "Continue", disabled = false, icon: Icon = ArrowRightIcon, className = "mt-10" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <button
      onClick={onBack}
      className="px-6 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/15 hover:bg-white/5 transition-colors"
    >
      Back
    </button>
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onContinue}
      disabled={disabled}
      className="btn-glow flex items-center gap-2 px-9 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10 disabled:opacity-40 disabled:pointer-events-none"
    >
      {continueLabel}
      <Icon className="w-4 h-4" />
    </motion.button>
  </div>
);

export default StepNav;
