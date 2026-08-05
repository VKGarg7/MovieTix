import React from "react";
import { motion } from "framer-motion";
import { MapPinIcon, MonitorPlayIcon, CalendarClockIcon, BanknoteIcon, PencilIcon, Trash2Icon, LayoutGridIcon, BarChart3Icon } from "lucide-react";
import TheaterArt from "../../cinematic/TheaterArt";
import { getTheaterPresentation } from "../../../lib/theaterPresentation";
import ActionIconButton from "../ActionIconButton";

const AdminTheaterCard = ({ theater, i, currency, screenCount, showsToday, revenueToday, selected, onSelect, onManageScreens, onAnalytics, onEdit, onDelete }) => {
  const { palette } = getTheaterPresentation(theater);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(i, 10) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      onClick={onSelect}
      className={`group relative rounded-3xl border overflow-hidden cursor-pointer transition-colors ${
        selected ? "border-primary/50" : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="relative h-28 w-full overflow-hidden">
        <TheaterArt palette={palette} name={theater.name} />
        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${
          theater.isActive !== false ? "bg-nebula-cyan/15 border-nebula-cyan/40 text-nebula-cyan" : "bg-white/10 border-white/20 text-gray-400"
        }`}>
          {theater.isActive !== false ? "Active" : "Inactive"}
        </span>
        <p className="absolute bottom-2 left-2.5 right-2.5 font-medium text-sm truncate">{theater.name}</p>
      </div>

      <div className="p-3.5 space-y-2.5 bg-white/[0.02]">
        <p className="flex items-center gap-1 text-xs text-gray-400 truncate">
          <MapPinIcon className="w-3 h-3 shrink-0" /> {theater.city}
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] py-1.5">
            <p className="flex items-center justify-center gap-1 text-[9px] text-gray-500"><MonitorPlayIcon className="w-2.5 h-2.5" /> Screens</p>
            <p className="text-sm font-medium mt-0.5">{screenCount}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] py-1.5">
            <p className="flex items-center justify-center gap-1 text-[9px] text-gray-500"><CalendarClockIcon className="w-2.5 h-2.5" /> Today</p>
            <p className="text-sm font-medium mt-0.5">{showsToday}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] py-1.5">
            <p className="flex items-center justify-center gap-1 text-[9px] text-gray-500"><BanknoteIcon className="w-2.5 h-2.5" /> Revenue</p>
            <p className="text-sm font-medium mt-0.5 text-nebula-cyan truncate">{currency}{Math.round(revenueToday).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIconButton variant="card" icon={PencilIcon} label="Edit" onClick={(e) => { e.stopPropagation(); onEdit(theater); }} />
          <ActionIconButton variant="card" icon={LayoutGridIcon} label="Manage Screens" onClick={(e) => { e.stopPropagation(); onManageScreens(theater); }} />
          <ActionIconButton variant="card" icon={BarChart3Icon} label="Analytics" onClick={(e) => { e.stopPropagation(); onAnalytics(theater); }} />
          <ActionIconButton variant="card" icon={Trash2Icon} label="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(theater); }} />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminTheaterCard;
