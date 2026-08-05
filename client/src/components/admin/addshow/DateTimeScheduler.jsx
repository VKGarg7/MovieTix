import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlusIcon, XIcon, CalendarDaysIcon } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const toISODate = (d) => d.toISOString().slice(0, 10);

const buildMonthGrid = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

const DateTimeScheduler = ({ dateTimeSelection, onAdd, onRemove }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(new Date());
  const [pickedDate, setPickedDate] = useState(null);
  const [pickedTime, setPickedTime] = useState("18:00");

  const cells = buildMonthGrid(viewDate);
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const handleAdd = () => {
    if (!pickedDate || !pickedTime) return;
    onAdd(toISODate(pickedDate), pickedTime);
  };

  const sortedDates = Object.keys(dateTimeSelection).sort();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d, i) => (
              <p key={i} className="text-center text-[10px] text-gray-500">{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const iso = toISODate(date);
              const isPast = date < today;
              const isPicked = pickedDate && toISODate(pickedDate) === iso;
              const hasSchedule = Boolean(dateTimeSelection[iso]);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => setPickedDate(date)}
                  className={`relative aspect-square rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                    isPicked ? "text-white" : "text-gray-300 hover:bg-white/10"
                  }`}
                  style={isPicked ? { background: "linear-gradient(135deg, #F84565, #6D5CFF)" } : undefined}
                >
                  {date.getDate()}
                  {hasSchedule && !isPicked && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-nebula-cyan" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col">
          <p className="text-xs text-gray-400 mb-2">
            {pickedDate ? pickedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "Pick a date first"}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="time"
              value={pickedTime}
              onChange={(e) => setPickedTime(e.target.value)}
              className="glass-input !rounded-xl text-sm py-2"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={!pickedDate}
            className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/90 hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" /> Add Screening
          </motion.button>
        </div>
      </div>

      {sortedDates.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
            <CalendarDaysIcon className="w-3.5 h-3.5" /> Scheduled Screenings
          </p>
          <div className="space-y-2.5">
            {sortedDates.map((date) => (
              <div key={date} className="flex items-start gap-3">
                <p className="text-xs text-gray-500 w-24 shrink-0 pt-1.5">
                  {new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence>
                    {dateTimeSelection[date].sort().map((time) => (
                      <motion.span
                        key={time}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-primary/30 bg-primary/10 text-white"
                      >
                        {time}
                        <button type="button" onClick={() => onRemove(date, time)} className="cursor-pointer text-primary/70 hover:text-primary">
                          <XIcon className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimeScheduler;
