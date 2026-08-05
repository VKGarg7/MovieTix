import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, CalendarDaysIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import isoTimeFormat from "../../lib/isoTimeFormat";
import Loading from "../../components/Loading";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";

const isDateSoldOut = (showtimes) => showtimes.every((s) => s.isSoldOut);

const DateStep = () => {
  const { fetchShowDetails } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(state.date);

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

  return (
    <div>
      <StepHeader step={3} title="Pick a Date & Time" />

      {dates.length === 0 ? (
        <p className="text-gray-400 font-light">No showtimes available for this movie at {state.theater.name}.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dates.map((date) => {
            const showtimes = state.show.dateTime[date];
            const soldOut = isDateSoldOut(showtimes);
            const isActive = selectedDate === date;

            return (
              <motion.div
                key={date}
                layout
                className={`glass-panel p-5 transition-colors ${isActive ? "border-primary/50" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDaysIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  {soldOut && (
                    <span className="text-[10px] font-semibold text-red-400 border border-red-400/50 rounded px-1.5 py-0.5">
                      SOLD OUT
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {showtimes.map((item) => {
                    const isSelected = state.date === date && state.time?.time === item.time;
                    return (
                      <motion.button
                        key={item.time}
                        whileHover={!item.isSoldOut ? { y: -3 } : {}}
                        whileTap={!item.isSoldOut ? { scale: 0.96 } : {}}
                        disabled={item.isSoldOut}
                        onClick={() => pickTime(date, item)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-[0_0_20px_-6px_rgba(248,69,101,0.8)]"
                            : "border-white/15 hover:border-white/30"
                        }`}
                      >
                        <ClockIcon className="w-3.5 h-3.5" />
                        {isoTimeFormat(item.time)}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <StepNav onBack={back} onContinue={next} continueLabel="Continue to Seats" disabled={!state.time} />
    </div>
  );
};

export default DateStep;
