import React from "react";
import { motion } from "framer-motion";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import Select from "../Select";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "paused", label: "Paused" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "percent", label: "Percentage" },
  { value: "flat", label: "Flat" },
];

const SORT_OPTIONS = [
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
  { value: "expiry-asc", label: "Expiry ↑" },
  { value: "usage-desc", label: "Usage ↓" },
];

const CouponFilterBar = ({ filters, setFilters, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-3">
      <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.query}
            onChange={update("query")}
            placeholder="Search coupon code..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
          />
        </div>

        <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />
        <Select value={filters.type} onChange={update("type")} options={TYPE_OPTIONS} className="!text-xs !py-1.5" />

        <input
          type="date"
          value={filters.date}
          onChange={update("date")}
          className="bg-[#1f1f24] text-white border border-primary/30 rounded px-2 py-1.5 text-xs"
        />

        <Select value={filters.sort} onChange={update("sort")} options={SORT_OPTIONS} className="!text-xs !py-1.5" />

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <RotateCcwIcon className="w-3.5 h-3.5" /> Reset
        </motion.button>

        <span className="text-[11px] text-gray-500 ml-auto pl-2 whitespace-nowrap">{resultCount} coupons</span>
      </div>
    </div>
  );
};

export default CouponFilterBar;
