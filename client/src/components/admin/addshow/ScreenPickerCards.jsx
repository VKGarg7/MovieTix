import React from "react";
import { motion } from "framer-motion";
import { ArmchairIcon, CheckIcon } from "lucide-react";

const ScreenPickerCards = ({ screens, value, onChange }) => {
  if (screens.length === 0) {
    return <p className="text-sm text-gray-500 px-1">Select a theater to see its screens.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {screens.map((screen, i) => {
        const seatTypes = [...new Set((screen.rows || []).map((r) => r.seatType))];
        const isSelected = value === screen._id;
        return (
          <motion.button
            key={screen._id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -3 }}
            onClick={() => onChange(screen._id)}
            className={`relative text-left p-4 rounded-2xl border backdrop-blur-xl transition-colors cursor-pointer ${
              isSelected
                ? "border-primary/50 bg-primary/10 shadow-[0_0_30px_-10px_rgba(248,69,101,0.6)]"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
            }`}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <CheckIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
              </span>
            )}
            <p className="text-sm font-medium mb-1">{screen.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
              <ArmchairIcon className="w-3.5 h-3.5" /> {screen.totalCapacity} seats
            </p>
            <div className="flex flex-wrap gap-1.5">
              {seatTypes.map((type) => (
                <span key={type} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-400 capitalize">
                  {type}
                </span>
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ScreenPickerCards;
