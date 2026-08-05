import React from "react";
import { SearchIcon } from "lucide-react";
import Select from "../Select";
import FilterBarShell from "../FilterBarShell";
import { CATEGORY_OPTIONS } from "../../../lib/menuItemStatus";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "out", label: "Out of Stock" },
];

const SORT_OPTIONS = [
  { value: "created-desc", label: "Newest First" },
  { value: "price-desc", label: "Price ↓" },
  { value: "price-asc", label: "Price ↑" },
  { value: "name-asc", label: "Name A–Z" },
];

const MenuFilterBar = ({ filters, setFilters, theaters, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <FilterBarShell onReset={onReset} resultCount={resultCount} resultLabel="items">
      <div className="relative flex-1 min-w-[160px]">
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={filters.query}
          onChange={update("query")}
          placeholder="Search menu item..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <Select value={filters.category} onChange={update("category")} options={[{ value: "all", label: "All Categories" }, ...CATEGORY_OPTIONS]} className="!text-xs !py-1.5" />
      <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />
      <Select
        value={filters.theater}
        onChange={update("theater")}
        options={[{ value: "all", label: "All Theaters" }, ...theaters.map((t) => ({ value: t._id, label: t.name }))]}
        className="!text-xs !py-1.5"
      />

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={filters.minPrice}
          onChange={update("minPrice")}
          placeholder="Min ₹"
          className="w-16 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
        <span className="text-gray-600 text-xs">–</span>
        <input
          type="number"
          value={filters.maxPrice}
          onChange={update("maxPrice")}
          placeholder="Max ₹"
          className="w-16 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
      </div>

      <Select value={filters.sort} onChange={update("sort")} options={SORT_OPTIONS} className="!text-xs !py-1.5" />
    </FilterBarShell>
  );
};

export default MenuFilterBar;
