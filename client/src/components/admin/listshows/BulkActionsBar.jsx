import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2Icon, CopyIcon, MoveIcon, BanIcon, DownloadIcon, XIcon } from "lucide-react";

const BulkActionsBar = ({ count, onClear, onDelete, onDuplicate, onMove, onCancel, onExport }) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky bottom-4 z-30 mx-auto max-w-2xl"
      >
        <div className="glass-panel !rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-2xl">
          <button onClick={onClear} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
            <XIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium text-white mr-2">{count} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {[
              { icon: CopyIcon, label: "Duplicate", onClick: onDuplicate },
              { icon: MoveIcon, label: "Move", onClick: onMove },
              { icon: BanIcon, label: "Cancel", onClick: onCancel },
              { icon: DownloadIcon, label: "Export", onClick: onExport },
              { icon: Trash2Icon, label: "Delete", onClick: onDelete, danger: true },
            ].map(({ icon: Icon, label, onClick, danger }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  danger ? "border-primary/25 text-primary hover:bg-primary/10" : "border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BulkActionsBar;
