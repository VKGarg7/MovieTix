import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshakeIcon, CheckIcon } from "lucide-react";
import { ACCOMMODATION_OPTIONS } from "../../../lib/accommodations";

const RelaxedScreeningConfigCard = ({ isRelaxedScreening, onToggle, accommodations, onAccommodationsChange }) => {
  const toggleAccommodation = (value) => {
    onAccommodationsChange(
      accommodations.includes(value) ? accommodations.filter((a) => a !== value) : [...accommodations, value]
    );
  };

  return (
    <div className="rounded-2xl border border-nebula-cyan/20 bg-nebula-cyan/[0.04] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-nebula-cyan/15 border border-nebula-cyan/30">
            <HeartHandshakeIcon className="w-4 h-4 text-nebula-cyan" />
          </span>
          <div>
            <p className="text-sm font-medium">Relaxed Screening</p>
            <p className="text-[11px] text-gray-500">Sensory-friendly house adjustments</p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => onToggle(!isRelaxedScreening)}
          className="relative w-11 h-6 rounded-full cursor-pointer shrink-0"
          style={{ background: isRelaxedScreening ? "linear-gradient(90deg, #3FD8E0, #6D5CFF)" : "rgba(255,255,255,0.1)" }}
        >
          <motion.span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
            animate={{ left: isRelaxedScreening ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {isRelaxedScreening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-gray-500 mt-3 mb-2.5 max-w-md">
              Pick the in-room adjustments staff will apply. These are shown to customers as expectation-setting
              copy — the software schedules and communicates them, staff carry them out.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACCOMMODATION_OPTIONS.map((opt) => {
                const selected = accommodations.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleAccommodation(opt.value)}
                    className={`text-left p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-2 ${
                      selected ? "border-nebula-cyan/50 bg-nebula-cyan/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        selected ? "bg-nebula-cyan border-nebula-cyan" : "border-white/20"
                      }`}
                    >
                      {selected && <CheckIcon className="w-3 h-3 text-void" />}
                    </span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RelaxedScreeningConfigCard;
