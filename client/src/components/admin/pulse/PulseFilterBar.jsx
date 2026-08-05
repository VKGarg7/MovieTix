import React from "react";
import { motion } from "framer-motion";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import Select from "../Select";

const OCCUPANCY_OPTIONS = [
  { value: "all", label: "All Occupancy" },
  { value: "low", label: "0–25%" },
  { value: "mid", label: "25–50%" },
  { value: "high", label: "50–75%" },
  { value: "critical", label: "75–100%" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "booking-fast", label: "Booking Fast" },
  { value: "almost-full", label: "Almost Full" },
  { value: "sold-out", label: "Sold Out" },
  { value: "low-demand", label: "Low Demand" },
  { value: "on-track", label: "On Track" },
];

const TIME_OPTIONS = [
  { value: "all", label: "All Times" },
  { value: "next-2h", label: "Next 2 hours" },
  { value: "next-6h", label: "Next 6 hours" },
  { value: "next-24h", label: "Next 24 hours" },
];

const PulseFilterBar = ({ filters, setFilters, theaters, movies, screens, adminRole, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-3">
      <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.query}
            onChange={update("query")}
            placeholder="Search movie or screen..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
          />
        </div>

        {adminRole === "superAdmin" && (
          <Select
            value={filters.theater}
            onChange={update("theater")}
            options={[{ value: "all", label: "All Theaters" }, ...theaters.map((t) => ({ value: t._id, label: `${t.name} · ${t.city}` }))]}
            className="!text-xs !py-1.5"
          />
        )}

        <Select value={filters.movie} onChange={update("movie")} options={[{ value: "all", label: "All Movies" }, ...movies.map((m) => ({ value: m, label: m }))]} className="!text-xs !py-1.5" />
        <Select value={filters.screen} onChange={update("screen")} options={[{ value: "all", label: "All Screens" }, ...screens.map((s) => ({ value: s, label: s }))]} className="!text-xs !py-1.5" />
        <Select value={filters.occupancy} onChange={update("occupancy")} options={OCCUPANCY_OPTIONS} className="!text-xs !py-1.5" />
        <Select value={filters.time} onChange={update("time")} options={TIME_OPTIONS} className="!text-xs !py-1.5" />
        <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <RotateCcwIcon className="w-3.5 h-3.5" /> Reset
        </motion.button>

        <span className="text-[11px] text-gray-500 ml-auto pl-2 whitespace-nowrap">{resultCount} shows</span>
      </div>
    </div>
  );
};

export default PulseFilterBar;
