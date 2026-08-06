import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClockIcon, CalendarDaysIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import isoTimeFormat from "../../lib/isoTimeFormat";
import Loading from "../../components/Loading";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";
import GlassPanel from "../../components/cinematic/GlassPanel";

const isDateSoldOut = (showtimes) => showtimes.every((s) => s.isSoldOut);

const FORMATS = ["2D", "3D", "IMAX", "4DX"];

const seatsBadge = (showtime) => {
  const { totalCapacity, occupiedCount } = showtime;
  if (!totalCapacity) return null;
  const left = totalCapacity - (occupiedCount || 0);
  if (left <= 0) return null;
  const pctLeft = left / totalCapacity;
  if (pctLeft <= 0.15) return { label: "Almost Full", tone: "danger" };
  if (pctLeft <= 0.4) return { label: "Fast Filling", tone: "amber" };
  return null;
};

const isSameDay = (isoDate, date) => isoDate === date.toISOString().split("T")[0];

const DateStep = () => {
  const { fetchShowDetails } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(state.date);
  const [format, setFormat] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await fetchShowDetails(state.movie._id, state.theater._id);
      if (!cancelled) {
        if (data) patch({ show: data });
        setLoading(false);
      }
    };
    if (state.movie && state.theater) load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.movie, state.theater]);

  const pickTime = (date, time) => {
    setSelectedDate(date);
    patch({ date, time, selectedSeats: [] });
  };

  if (loading || !state.show) return <Loading />;

  const dates = Object.keys(state.show.dateTime || {});
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const activeDate = selectedDate || dates[0];
  const showtimes = activeDate ? state.show.dateTime[activeDate] || [] : [];

  return (
    <div>
      <StepHeader step={3} title="Pick a Date & Time" />

      {dates.length === 0 ? (
        <p className="text-gray-400 font-light">No showtimes available for this movie at {state.theater.name}.</p>
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* left: calendar */}
          <GlassPanel hover={false} className="p-5 h-max">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-primary" /> Choose Date
            </p>
            <div className="flex gap-2 mb-4">
              {isSameDay(dates[0], today) && (
                <button
                  onClick={() => setSelectedDate(dates[0])}
                  className="px-3 py-1.5 rounded-full text-[11px] border border-white/10 bg-white/[0.04] hover:border-white/25 transition-colors cursor-pointer"
                >
                  Today
                </button>
              )}
              {dates.find((d) => isSameDay(d, tomorrow)) && (
                <button
                  onClick={() => setSelectedDate(dates.find((d) => isSameDay(d, tomorrow)))}
                  className="px-3 py-1.5 rounded-full text-[11px] border border-white/10 bg-white/[0.04] hover:border-white/25 transition-colors cursor-pointer"
                >
                  Tomorrow
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
              {dates.map((date) => {
                const soldOut = isDateSoldOut(state.show.dateTime[date]);
                const isActive = activeDate === date;
                return (
                  <motion.button
                    key={date}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(date)}
                    className={`relative flex flex-col items-center justify-center h-14 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-primary border-primary text-white shadow-[0_0_25px_-5px_rgba(248,69,101,0.8)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/25"
                    }`}
                  >
                    <span className="font-medium text-sm">{new Date(date).getDate()}</span>
                    <span className="text-[10px] uppercase tracking-wide">
                      {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    {soldOut && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[7px] font-semibold px-1 py-0.5 rounded">
                        FULL
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <p className="text-sm font-medium mt-6 mb-2">Format</p>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...FORMATS].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                    format === f ? "bg-primary border-primary text-white" : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/25"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </GlassPanel>

          {/* right: showtimes */}
          <GlassPanel hover={false} className="p-5">
            <p className="text-sm font-medium mb-4">
              Showtimes on {activeDate && new Date(activeDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>

            <AnimatePresence mode="wait">
              {showtimes.length === 0 ? (
                <p className="text-gray-400 text-sm">No showtimes available for this date.</p>
              ) : (
                <motion.div
                  key={activeDate}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap gap-3"
                >
                  {showtimes.map((item, i) => {
                    const badge = seatsBadge(item);
                    const isSelected = state.date === activeDate && state.time?.time === item.time;
                    const price = item.computedPrice ?? item.showPrice;
                    const seatsLeft = item.totalCapacity != null ? item.totalCapacity - (item.occupiedCount || 0) : null;
                    const itemFormat = FORMATS[i % FORMATS.length];
                    if (format !== "all" && itemFormat !== format) return null;

                    return (
                      <motion.button
                        key={item.time}
                        whileHover={!item.isSoldOut ? { y: -3, scale: 1.02 } : {}}
                        whileTap={!item.isSoldOut ? { scale: 0.97 } : {}}
                        disabled={item.isSoldOut}
                        onClick={() => pickTime(activeDate, item)}
                        className={`relative flex flex-col items-start gap-1.5 px-4 py-3 rounded-2xl border text-left min-w-36 transition-colors ${
                          item.isSoldOut
                            ? "border-white/5 bg-white/[0.02] opacity-40 grayscale cursor-not-allowed"
                            : isSelected
                              ? "border-primary bg-primary/10 shadow-[0_0_22px_-6px_rgba(248,69,101,0.8)]"
                              : "border-emerald-400/20 bg-white/[0.04] hover:border-emerald-400/50 cursor-pointer"
                        }`}
                      >
                        {badge && !item.isSoldOut && (
                          <span
                            className={`absolute -top-2 -right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                              badge.tone === "danger"
                                ? "bg-red-600/90 border-red-400/50 text-white"
                                : "bg-nebula-amber/90 border-nebula-amber/50 text-void"
                            }`}
                          >
                            {badge.label}
                          </span>
                        )}
                        {i === 0 && !item.isSoldOut && !badge && (
                          <span className="absolute -top-2 -right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-nebula-cyan/90 border-nebula-cyan/50 text-void">
                            Best Value
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {isoTimeFormat(item.time)}
                        </span>
                        <span className="text-[11px] text-gray-400">{itemFormat}</span>
                        {price != null && <span className="text-xs text-nebula-cyan font-medium">₹{price}</span>}
                        {seatsLeft != null && !item.isSoldOut && (
                          <span className="text-[10px] text-gray-500">{seatsLeft} seats left</span>
                        )}
                        {item.isSoldOut && <span className="text-[10px] text-red-400 font-semibold">SOLD OUT</span>}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Selected</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500" /> Sold Out</span>
            </div>
          </GlassPanel>
        </div>
      )}

      <StepNav onBack={back} onContinue={next} continueLabel="Continue to Seats" disabled={!state.time} />
    </div>
  );
};

export default DateStep;
