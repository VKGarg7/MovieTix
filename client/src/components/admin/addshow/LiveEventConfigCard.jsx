import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioTowerIcon } from "lucide-react";

const LiveEventConfigCard = ({
  isLiveEvent, onToggle, simulcastStartTime, onSimulcastStartTimeChange, combinedRuntimeMinutes, onCombinedRuntimeChange,
}) => (
  <div className="rounded-2xl border border-nebula-amber/20 bg-nebula-amber/[0.04] p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-nebula-amber/15 border border-nebula-amber/30">
          <RadioTowerIcon className="w-4 h-4 text-nebula-amber" />
        </span>
        <div>
          <p className="text-sm font-medium">Live Q&amp;A / Simulcast Event</p>
          <p className="text-[11px] text-gray-500">Film + live segment, synchronized across theaters</p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => onToggle(!isLiveEvent)}
        className="relative w-11 h-6 rounded-full cursor-pointer shrink-0"
        style={{ background: isLiveEvent ? "linear-gradient(90deg, #FFB86B, #F84565)" : "rgba(255,255,255,0.1)" }}
      >
        <motion.span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: isLiveEvent ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>

    <AnimatePresence>
      {isLiveEvent && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="text-[11px] text-gray-500 mt-3 mb-2.5 max-w-md">
            Set the exact simulcast start time — if you're scheduling this same event at other theaters,
            enter this same time there too so the live segment stays synchronized. Combined runtime is
            shown to customers so they know what to expect (film + live segment).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Simulcast start time</label>
              <input
                type="datetime-local"
                value={simulcastStartTime}
                onChange={(e) => onSimulcastStartTimeChange(e.target.value)}
                className="w-full bg-black/20 border border-nebula-amber/30 rounded-lg px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Combined runtime (minutes)</label>
              <input
                type="number"
                min="1"
                value={combinedRuntimeMinutes}
                onChange={(e) => onCombinedRuntimeChange(e.target.value)}
                placeholder="e.g. 150"
                className="w-full bg-black/20 border border-nebula-amber/30 rounded-lg px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default LiveEventConfigCard;
