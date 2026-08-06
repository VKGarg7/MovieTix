import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilmIcon,
  Building2Icon,
  CalendarDaysIcon,
  ArmchairIcon,
  PopcornIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useBookingFlow } from "../../context/BookingFlowContext";
import isoTimeFormat from "../../lib/isoTimeFormat";

const currency = import.meta.env.VITE_CURRENCY;

const Row = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
};

const BookingSidebar = () => {
  const { state } = useBookingFlow();
  const [collapsed, setCollapsed] = useState(true);

  const snacksTotal = state.menuItems
    .filter((item) => state.snackQuantities[item._id] > 0)
    .reduce((sum, item) => sum + item.price * state.snackQuantities[item._id], 0);
  const ticketAmount = state.time ? (state.time.computedPrice ?? state.time.showPrice ?? 0) * state.selectedSeats.length : 0;
  const total = ticketAmount + snacksTotal;

  const snackSummary = state.menuItems
    .filter((item) => state.snackQuantities[item._id] > 0)
    .map((item) => `${item.name} x${state.snackQuantities[item._id]}`)
    .join(", ");

  const hasAnySelection = state.movie || state.theater || state.time || state.selectedSeats.length > 0;
  if (!hasAnySelection) return null;

  const content = (
    <div className="flex flex-col gap-4">
      <Row icon={FilmIcon} label="Movie" value={state.movie?.title} />
      <Row icon={Building2Icon} label="Theater" value={state.theater?.name} />
      <Row
        icon={CalendarDaysIcon}
        label="Date & Time"
        value={
          state.date
            ? `${new Date(state.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${
                state.time ? ` · ${isoTimeFormat(state.time.time)}` : ""
              }`
            : null
        }
      />
      <Row
        icon={ArmchairIcon}
        label="Seats"
        value={state.selectedSeats.length > 0 ? state.selectedSeats.join(", ") : null}
      />
      <Row icon={PopcornIcon} label="Food" value={snackSummary || null} />

      {total > 0 && (
        <div className="pt-3 mt-1 border-t border-white/10 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.15, color: "#F84565" }}
            animate={{ scale: 1, color: "#FFFFFF" }}
            transition={{ duration: 0.4 }}
            className="text-lg font-semibold"
          >
            {currency}
            {total}
          </motion.span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* desktop persistent sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block w-80 shrink-0"
      >
        <div className="glass-panel p-6 sticky top-28 relative overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ background: "radial-gradient(circle, #F84565, transparent 70%)" }}
          />
          <p className="section-eyebrow mb-4">Booking Summary</p>
          {content}
        </div>
      </motion.aside>

      {/* mobile/tablet collapsible bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="glass-panel rounded-b-none border-b-0 mx-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              Booking Summary
              {total > 0 && <span className="text-primary">· {currency}{total}</span>}
            </span>
            {collapsed ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-1">{content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default BookingSidebar;
