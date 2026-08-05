import React from "react";
import { motion } from "framer-motion";
import { EyeIcon } from "lucide-react";
import { getActionMeta, getEntitySummary } from "../../../lib/auditSummary";

const DOT_COLOR = {
  create: "bg-emerald-400",
  update: "bg-nebula-cyan",
  delete: "bg-primary",
  export: "bg-nebula-violet",
  login: "bg-nebula-amber",
};

const ActivityTimeline = ({ entries, onViewDetails }) => (
  <div className="relative pl-6">
    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
    <div className="space-y-4">
      {entries.map((entry, i) => {
        const meta = getActionMeta(entry.action);
        const time = new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return (
          <motion.div
            key={entry._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 15) * 0.04, duration: 0.35 }}
            className="relative"
          >
            <span className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ${DOT_COLOR[entry.action] || "bg-gray-500"} ring-4 ring-void`} />
            <div className="rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 p-3.5 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-200">{time}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${meta.cls}`}>{meta.label}</span>
              </div>
              <p className="text-sm text-gray-200">{getEntitySummary(entry)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">by {entry.actorName || entry.actorId}</p>

              <button
                onClick={() => onViewDetails(entry)}
                className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <EyeIcon className="w-3 h-3" /> View Details
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default ActivityTimeline;
