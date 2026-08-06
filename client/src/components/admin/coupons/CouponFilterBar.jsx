import React from "react";
import { SearchIcon } from "lucide-react";
import Select from "../Select";
import FilterBarShell from "../FilterBarShell";

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
    <FilterBarShell onReset={onReset} resultCount={resultCount} resultLabel="coupons">
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
    </FilterBarShell>
  );
};

export default CouponFilterBar;
