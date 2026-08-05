import React from "react";
import { motion } from "framer-motion";
import { Building2Icon, MapPinIcon, MonitorPlayIcon, ArmchairIcon, CalendarClockIcon } from "lucide-react";

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
    <p className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><Icon className="w-3 h-3" /> {label}</p>
    <p className="text-sm font-medium text-gray-200">{value}</p>
  </div>
);

const TheaterSummaryPanel = ({ theater, screenCount, totalSeats, showsToday }) => {
  if (!theater) {
    return (
      <div className="glass-panel !rounded-3xl p-6 flex flex-col items-center justify-center text-center py-12">
        <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-nebula-violet/10 border border-nebula-violet/25 mb-3">
          <Building2Icon className="w-6 h-6 text-nebula-violet" />
        </span>
        <p className="text-sm text-gray-500 max-w-xs">Select a theater from the list to manage its screens.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass-panel !rounded-3xl p-5">
      <h3 className="font-display text-lg font-medium truncate">{theater.name}</h3>
      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1"><MapPinIcon className="w-3 h-3" /> {theater.city}</p>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <StatTile icon={MonitorPlayIcon} label="Active Screens" value={screenCount} />
        <StatTile icon={ArmchairIcon} label="Total Seats" value={totalSeats} />
        <StatTile icon={CalendarClockIcon} label="Today's Shows" value={showsToday} />
      </div>
    </motion.div>
  );
};

export default TheaterSummaryPanel;
