import React from "react";
import { SearchIcon } from "lucide-react";
import Select from "../Select";
import FilterBarShell from "../FilterBarShell";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "time_of_week", label: "Time-of-week" },
  { value: "early_bird", label: "Early-bird" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

const SORT_OPTIONS = [
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
  { value: "adjustment-desc", label: "Adjustment ↓" },
  { value: "adjustment-asc", label: "Adjustment ↑" },
];

const RuleFilterBar = ({ filters, setFilters, theaters, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <FilterBarShell onReset={onReset} resultCount={resultCount} resultLabel="rules">
      <div className="relative flex-1 min-w-[160px]">
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={filters.query}
          onChange={update("query")}
          placeholder="Search rule name..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <Select value={filters.type} onChange={update("type")} options={TYPE_OPTIONS} className="!text-xs !py-1.5" />
      <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />
      <Select
        value={filters.theater}
        onChange={update("theater")}
        options={[{ value: "all", label: "All Theaters" }, ...theaters.map((t) => ({ value: t._id, label: t.name }))]}
        className="!text-xs !py-1.5"
      />
      <Select value={filters.sort} onChange={update("sort")} options={SORT_OPTIONS} className="!text-xs !py-1.5" />
    </FilterBarShell>
  );
};

export default RuleFilterBar;
