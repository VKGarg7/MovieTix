import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioIcon, TicketIcon } from "lucide-react";

const LiveActivitySidebar = ({ events }) => (
  <div className="glass-panel !rounded-2xl p-4">
    <p className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-3">
      <RadioIcon className="w-3.5 h-3.5 text-nebula-cyan" /> Live Activity
    </p>
    {events.length === 0 ? (
      <p className="text-xs text-gray-500">Watching for booking activity…</p>
    ) : (
      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-xs"
            >
              <TicketIcon className="w-3.5 h-3.5 text-nebula-cyan shrink-0 mt-0.5" />
              <span className="text-gray-300">{e.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )}
  </div>
);

export default LiveActivitySidebar;
