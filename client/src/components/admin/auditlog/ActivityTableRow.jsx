import React from "react";
import { motion } from "framer-motion";
import { EyeIcon, CheckCircle2Icon } from "lucide-react";
import ActionBadge from "./ActionBadge";
import ActorCell from "./ActorCell";
import EntityCell from "./EntityCell";
import RelativeTime from "./RelativeTime";
import { getEntitySummary } from "../../../lib/auditSummary";

const ActivityTableRow = ({ entry, i, now, onViewDetails }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.03, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -2 }}
    className="group grid grid-cols-[110px_170px_90px_180px_1fr_80px_90px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 px-3.5 py-2.5 transition-colors"
  >
    <RelativeTime value={entry.createdAt} now={now} />
    <ActorCell entry={entry} />
    <ActionBadge action={entry.action} />
    <EntityCell entry={entry} />
    <p className="text-xs text-gray-300 truncate">{getEntitySummary(entry)}</p>
    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
      <CheckCircle2Icon className="w-3 h-3" /> Success
    </span>
    <button
      onClick={() => onViewDetails(entry)}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer justify-self-end"
    >
      <EyeIcon className="w-3 h-3" /> Details
    </button>
  </motion.div>
);

export default ActivityTableRow;
