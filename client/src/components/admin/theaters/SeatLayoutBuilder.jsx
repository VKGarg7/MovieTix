import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { SEAT_TYPE_META, SEAT_TYPE_OPTIONS } from "../../../lib/seatLayoutBuilder";

const MAX_PREVIEW_SEATS = 20;

const SeatLayoutBuilder = ({ rows, onUpdateRow, onAddRow, onDuplicateRow, onDeleteRow }) => (
  <div className="glass-panel !rounded-3xl p-5 md:p-6">
    <div className="flex items-center justify-between mb-1">
      <h2 className="font-display text-xl font-medium">Seat Layout Builder</h2>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onAddRow}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 text-gray-300 hover:bg-white/5 cursor-pointer transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" /> Add Row
      </motion.button>
    </div>
    <p className="text-sm text-gray-500 mb-4">Design the row-by-row seating layout visually.</p>

    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {rows.map((row, index) => {
          const meta = SEAT_TYPE_META[row.seatType] || SEAT_TYPE_META.regular;
          const count = Number(row.seatCount) || 0;
          const previewCount = Math.min(count, MAX_PREVIEW_SEATS);

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <input
                  value={row.label}
                  onChange={(e) => onUpdateRow(index, "label", e.target.value.toUpperCase().slice(0, 1))}
                  maxLength={1}
                  className="w-9 h-9 text-center rounded-lg bg-white/[0.04] border border-white/10 text-sm font-semibold focus:outline-none focus:border-primary/40"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={row.seatCount}
                  onChange={(e) => onUpdateRow(index, "seatCount", e.target.value)}
                  className="w-20 h-9 text-center rounded-lg bg-white/[0.04] border border-white/10 text-sm focus:outline-none focus:border-primary/40"
                />
                <div className="flex flex-wrap gap-1">
                  {SEAT_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onUpdateRow(index, "seatType", opt.value)}
                      className={`px-2 py-1 rounded-full text-[10px] border transition-colors cursor-pointer ${
                        row.seatType === opt.value
                          ? "text-white"
                          : "border-white/10 text-gray-500 hover:bg-white/5"
                      }`}
                      style={row.seatType === opt.value ? { background: `${SEAT_TYPE_META[opt.value].color}33`, borderColor: `${SEAT_TYPE_META[opt.value].color}66` } : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <button type="button" onClick={() => onDuplicateRow(index)} className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
                    <CopyIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRow(index)}
                    disabled={rows.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-primary/25 text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-500 mr-1">{row.label || "?"}</span>
                {Array.from({ length: previewCount }).map((_, seatIdx) => (
                  <motion.span
                    key={seatIdx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: seatIdx * 0.008 }}
                    className="w-4 h-4 rounded-sm"
                    style={{ background: meta.color }}
                    title={meta.label}
                  />
                ))}
                {count > MAX_PREVIEW_SEATS && (
                  <span className="text-[10px] text-gray-500">+{count - MAX_PREVIEW_SEATS} more</span>
                )}
                <span className="text-[10px] text-gray-500 ml-2">{meta.label}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>

    <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/10">
      {Object.entries(SEAT_TYPE_META).map(([key, meta]) => (
        <span key={key} className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-3 h-3 rounded-sm" style={{ background: meta.color }} />
          {meta.label}
        </span>
      ))}
    </div>
  </div>
);

export default SeatLayoutBuilder;
