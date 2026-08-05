import React from "react";
import { motion } from "framer-motion";
import { SearchIcon, RotateCcwIcon, TableIcon, GitBranchIcon } from "lucide-react";
import Select from "../Select";
import DateRangePicker from "../DateRangePicker";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All entity types" },
  { value: "Show", label: "Show" },
  { value: "Theater", label: "Theater" },
  { value: "Screen", label: "Screen" },
  { value: "Movie", label: "Movie" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
];

const ActivityFilterBar = ({
  actorId, setActorId, entityType, setEntityType, actionFilter, setActionFilter,
  range, setRange, query, setQuery, onReset, resultCount, viewMode, setViewMode,
}) => (
  <div className="sticky top-0 z-20 -mx-1 px-1 py-3">
    <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movie, user, coupon, show ID, theater..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <input
        value={actorId}
        onChange={(e) => setActorId(e.target.value)}
        placeholder="Actor ID"
        className="w-32 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
      />

      <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} options={ENTITY_TYPE_OPTIONS} className="!text-xs !py-1.5" />
      <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} options={ACTION_OPTIONS} className="!text-xs !py-1.5" />

      <DateRangePicker from={range.from} to={range.to} onChange={setRange} />

      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
        {[
          { mode: "table", Icon: TableIcon, label: "Table" },
          { mode: "timeline", Icon: GitBranchIcon, label: "Timeline" },
        ].map(({ mode, Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`relative flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${viewMode === mode ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {viewMode === mode && (
              <motion.span layoutId="auditViewModeActive" className="absolute inset-0 rounded-md bg-primary/20 border border-primary/30" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
            )}
            <Icon className="w-3.5 h-3.5 relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onReset}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
      >
        <RotateCcwIcon className="w-3.5 h-3.5" /> Reset
      </motion.button>

      <span className="text-[11px] text-gray-500 ml-auto pl-2 whitespace-nowrap">{resultCount} events</span>
    </div>
  </div>
);

export default ActivityFilterBar;
