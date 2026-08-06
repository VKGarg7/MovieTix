import React from "react";
import { SearchIcon } from "lucide-react";
import Select from "../Select";
import FilterBarShell from "../FilterBarShell";

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
    <FilterBarShell onReset={onReset} resultCount={resultCount} resultLabel="shows">
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
    </FilterBarShell>
  );
};

export default PulseFilterBar;
