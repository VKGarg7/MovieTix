import React from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const PaginationShell = ({
  page,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  onPageSizeChange,
  label = "items total",
  simple = false,
  className = "glass-panel !rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 text-xs",
}) => {
  if (totalPages <= 1 && (!totalCount || totalCount <= pageSize)) return null;

  if (simple) {
    return (
      <div className="flex items-center gap-4 mt-4 text-sm">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <span className="text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    );
  }

  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className={className}>
      <span className="text-gray-500">
        Showing {rangeStart}–{rangeEnd} of {totalCount.toLocaleString()} {label}
      </span>

      {typeof onPageSizeChange === "function" && (
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-gray-500">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[#1f1f24] text-white border border-primary/30 rounded px-1.5 py-1 text-xs"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>

        {pages.map((p, idx) => (
          <React.Fragment key={p}>
            {idx > 0 && pages[idx - 1] !== p - 1 && <span className="text-gray-600 px-1">…</span>}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onPageChange(p)}
              className={`relative w-7 h-7 rounded-lg text-xs font-medium cursor-pointer ${p === page ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              {p === page && (
                <motion.span layoutId="paginationActive" className="absolute inset-0 rounded-lg bg-primary/25 border border-primary/40" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
              )}
              <span className="relative">{p}</span>
            </motion.button>
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={page}
          key={page}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const n = Number(e.currentTarget.value);
            if (n >= 1 && n <= totalPages) onPageChange(n);
          }}
          className="w-14 bg-[#1f1f24] text-white border border-primary/30 rounded px-1.5 py-1 text-xs"
        />
      </div>
    </div>
  );
};

export default PaginationShell;