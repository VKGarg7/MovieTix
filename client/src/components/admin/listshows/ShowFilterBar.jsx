import React from "react";
import { motion } from "framer-motion";
import { SearchIcon, TableIcon, LayoutGridIcon } from "lucide-react";
import Select from "../Select";
import FilterBarShell from "../FilterBarShell";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "running", label: "Running" },
  { value: "upcoming", label: "Upcoming" },
  { value: "full", label: "House Full" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "time-asc", label: "Show Time ↑" },
  { value: "time-desc", label: "Show Time ↓" },
  { value: "occupancy-desc", label: "Occupancy ↓" },
  { value: "revenue-desc", label: "Revenue ↓" },
];

const ShowFilterBar = ({ filters, setFilters, languages, genres, viewMode, setViewMode, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <FilterBarShell onReset={onReset} resultCount={resultCount} resultLabel="shows">
      <div className="relative flex-1 min-w-[160px]">
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={filters.movieQuery}
          onChange={update("movieQuery")}
          placeholder="Search movie..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <div className="relative flex-1 min-w-[160px]">
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={filters.theaterQuery}
          onChange={update("theaterQuery")}
          placeholder="Search theater..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />

      <input
        type="date"
        value={filters.date}
        onChange={update("date")}
        className="bg-[#1f1f24] text-white border border-primary/30 rounded px-2 py-1.5 text-xs"
      />

      <Select
        value={filters.language}
        onChange={update("language")}
        options={[{ value: "all", label: "All Languages" }, ...languages.map((l) => ({ value: l, label: l }))]}
        className="!text-xs !py-1.5"
      />

      <Select
        value={filters.genre}
        onChange={update("genre")}
        options={[{ value: "all", label: "All Genres" }, ...genres.map((g) => ({ value: g, label: g }))]}
        className="!text-xs !py-1.5"
      />

      <Select value={filters.sort} onChange={update("sort")} options={SORT_OPTIONS} className="!text-xs !py-1.5" />

      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
        {[
          { mode: "table", Icon: TableIcon },
          { mode: "grid", Icon: LayoutGridIcon },
        ].map(({ mode, Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`relative px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${viewMode === mode ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {viewMode === mode && (
              <motion.span layoutId="viewModeActive" className="absolute inset-0 rounded-md bg-primary/20 border border-primary/30" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
            )}
            <Icon className="w-3.5 h-3.5 relative" />
          </button>
        ))}
      </div>
    </FilterBarShell>
  );
};

export default ShowFilterBar;
