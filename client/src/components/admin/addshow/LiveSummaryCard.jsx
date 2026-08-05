import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FilmIcon, Building2Icon, MonitorPlayIcon, BanknoteIcon, CalendarClockIcon } from "lucide-react";

const LiveSummaryCard = ({ movie, theater, screen, showPrice, dateTimeSelection, currency }) => {
  const screeningCount = useMemo(
    () => Object.values(dateTimeSelection).reduce((sum, times) => sum + times.length, 0),
    [dateTimeSelection]
  );

  const rows = [
    { icon: FilmIcon, label: "Movie", value: movie?.title || "—" },
    { icon: Building2Icon, label: "Theater", value: theater?.name || "—" },
    { icon: MonitorPlayIcon, label: "Screen", value: screen?.name || "—" },
    { icon: BanknoteIcon, label: "Base Price", value: showPrice ? `${currency}${showPrice}` : "—" },
    { icon: CalendarClockIcon, label: "Screenings", value: screeningCount > 0 ? `${screeningCount} scheduled` : "—" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
      <p className="text-xs text-gray-400 mb-1">Summary</p>
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <motion.div key={row.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Icon className="w-3.5 h-3.5" /> {row.label}
            </span>
            <span className="text-gray-200 font-medium truncate max-w-40 text-right">{row.value}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LiveSummaryCard;
