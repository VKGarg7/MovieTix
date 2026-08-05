import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlusIcon, MinusIcon, PencilIcon } from "lucide-react";
import ActionBadge from "./ActionBadge";
import ActorCell from "./ActorCell";
import { computeFieldDiff, getEntitySummary } from "../../../lib/auditSummary";

const STATUS_META = {
  added: { icon: PlusIcon, cls: "border-l-2 border-emerald-500 bg-emerald-500/[0.06]", label: "text-emerald-400" },
  removed: { icon: MinusIcon, cls: "border-l-2 border-primary bg-primary/[0.06]", label: "text-primary" },
  modified: { icon: PencilIcon, cls: "border-l-2 border-nebula-cyan bg-nebula-cyan/[0.06]", label: "text-nebula-cyan" },
  unchanged: { icon: null, cls: "border-l-2 border-transparent", label: "text-gray-500" },
};

const formatValue = (v) => {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const DiffDrawer = ({ entry, onClose }) => {
  const before = entry?.diff?.before;
  const after = entry?.diff?.after;
  const rows = entry ? computeFieldDiff(before, after) : [];

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-panel !rounded-none !rounded-l-3xl overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-medium">Event Details</h3>
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ActionBadge action={entry.action} />
                <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>

              <p className="text-sm text-gray-200">{getEntitySummary(entry)}</p>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] text-gray-500 mb-2">Actor</p>
                <ActorCell entry={entry} />
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400"><PlusIcon className="w-3 h-3" /> Added</span>
                  <span className="flex items-center gap-1 text-primary"><MinusIcon className="w-3 h-3" /> Removed</span>
                  <span className="flex items-center gap-1 text-nebula-cyan"><PencilIcon className="w-3 h-3" /> Modified</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden font-mono text-[11px]">
                  {rows.length === 0 ? (
                    <p className="p-3 text-gray-500">No field-level changes recorded.</p>
                  ) : (
                    rows.map((row) => {
                      const meta = STATUS_META[row.status];
                      const Icon = meta.icon;
                      return (
                        <div key={row.key} className={`px-3 py-1.5 ${meta.cls}`}>
                          <div className="flex items-center gap-1.5">
                            {Icon && <Icon className={`w-2.5 h-2.5 ${meta.label}`} />}
                            <span className="text-gray-300">{row.key}</span>
                          </div>
                          {row.status === "modified" ? (
                            <div className="pl-4 mt-0.5">
                              <p className="text-primary/80 line-through decoration-primary/50">{formatValue(row.before)}</p>
                              <p className="text-emerald-400">{formatValue(row.after)}</p>
                            </div>
                          ) : row.status === "added" ? (
                            <p className="pl-4 mt-0.5 text-emerald-400">{formatValue(row.after)}</p>
                          ) : row.status === "removed" ? (
                            <p className="pl-4 mt-0.5 text-primary/80">{formatValue(row.before)}</p>
                          ) : (
                            <p className="pl-4 mt-0.5 text-gray-500">{formatValue(row.after)}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <details className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <summary className="text-[11px] text-gray-400 cursor-pointer">Raw JSON</summary>
                <pre className="mt-2 text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(entry.diff, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DiffDrawer;
