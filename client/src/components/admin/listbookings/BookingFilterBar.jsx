import React from "react";
import { motion } from "framer-motion";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import Select from "../Select";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "pending", label: "Pending" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Amount ↓" },
  { value: "amount-asc", label: "Amount ↑" },
];

const BookingFilterBar = ({ filters, setFilters, movies, theaters, seatTypes, onReset, resultCount }) => {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-3">
      <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.bookingQuery}
            onChange={update("bookingQuery")}
            placeholder="Search booking ID..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="relative flex-1 min-w-[150px]">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.customerQuery}
            onChange={update("customerQuery")}
            placeholder="Search customer..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
          />
        </div>

        <Select
          value={filters.movie}
          onChange={update("movie")}
          options={[{ value: "all", label: "All Movies" }, ...movies.map((m) => ({ value: m, label: m }))]}
          className="!text-xs !py-1.5"
        />

        <Select
          value={filters.theater}
          onChange={update("theater")}
          options={[{ value: "all", label: "All Theaters" }, ...theaters.map((t) => ({ value: t, label: t }))]}
          className="!text-xs !py-1.5"
        />

        <Select value={filters.status} onChange={update("status")} options={STATUS_OPTIONS} className="!text-xs !py-1.5" />
        <Select value={filters.payment} onChange={update("payment")} options={PAYMENT_OPTIONS} className="!text-xs !py-1.5" />

        <input
          type="date"
          value={filters.date}
          onChange={update("date")}
          className="bg-[#1f1f24] text-white border border-primary/30 rounded px-2 py-1.5 text-xs"
        />

        <Select
          value={filters.seatType}
          onChange={update("seatType")}
          options={[{ value: "all", label: "All Seat Types" }, ...seatTypes.map((s) => ({ value: s, label: s }))]}
          className="!text-xs !py-1.5"
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

        <span className="text-[11px] text-gray-500 ml-auto pl-2 whitespace-nowrap">{resultCount} bookings</span>
      </div>
    </div>
  );
};

export default BookingFilterBar;
