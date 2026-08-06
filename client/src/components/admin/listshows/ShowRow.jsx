import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon, ClockIcon, Building2Icon, MonitorPlayIcon, StarIcon,
  EyeIcon, PencilIcon, CopyIcon, BarChart3Icon, Trash2Icon, SparklesIcon,
  ArmchairIcon, PopcornIcon, TicketPercentIcon, UsersIcon, FilmIcon,
} from "lucide-react";
import { dateFormat } from "../../../lib/dateFomat";
import ShowStatusPill from "./ShowStatusPill";
import { getShowStatus } from "../../../lib/showStatus";
import OccupancyBar from "./OccupancyBar";
import ActionIconButton from "../ActionIconButton";
import DetailTile from "../DetailTile";
import InsightPanel from "../InsightPanel";

const formatCountdown = (ms) => {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
};

const ShowRow = ({ show, i, now, currency, imageBaseUrl, selected, onToggleSelect, onEdit, onDelete, onDuplicate, onAnalytics, onExportTrailerVote, savingId }) => {
  const [expanded, setExpanded] = useState(false);

  const status = getShowStatus(show, now);
  const occupied = Object.keys(show.occupiedSeats || {}).length;
  const capacity = show.screen?.totalCapacity || 0;
  const revenue = occupied * show.showPrice;
  const remainingMs = new Date(show.showDateTime).getTime() - now;
  const countdown = status === "upcoming" ? formatCountdown(remainingMs) : null;
  const aiScore = Math.min(99, Math.round(((show.movie?.vote_average || 6) / 10) * 60 + (capacity ? (occupied / capacity) * 40 : 20)));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative rounded-2xl border overflow-hidden transition-colors ${
        selected ? "border-primary/40 bg-primary/[0.04]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(show._id)}
          className="cursor-pointer accent-primary"
        />

        <div className="relative w-11 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <motion.img
            src={imageBaseUrl + (show.movie?.poster_path || show.movie?.backdrop_path)}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.12 }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="min-w-[170px] flex-1 max-w-[220px]">
          <p className="text-sm font-medium truncate">{show.movie?.title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
            {show.movie?.genres?.[0]?.name && <span className="truncate">{show.movie.genres[0].name}</span>}
            {show.movie?.original_language && <span className="uppercase">· {show.movie.original_language}</span>}
            {show.movie?.runtime && <span>· {show.movie.runtime}m</span>}
            {show.movie?.vote_average > 0 && (
              <span className="flex items-center gap-0.5 text-nebula-amber">
                <StarIcon className="w-2.5 h-2.5 fill-current" />
                {show.movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-[140px] text-xs text-gray-300">
          <p className="flex items-center gap-1 truncate">
            <Building2Icon className="w-3 h-3 text-gray-500 shrink-0" />
            {show.screen?.theater?.name || "—"}
          </p>
          <p className="flex items-center gap-1 text-gray-500 text-[11px] mt-0.5 truncate">
            <MonitorPlayIcon className="w-3 h-3 shrink-0" />
            {show.screen?.name || "—"} · {show.screen?.theater?.city || "—"}
          </p>
        </div>

        <div className="min-w-[150px] text-xs">
          <p className="text-gray-200">{dateFormat(show.showDateTime)}</p>
          {countdown && (
            <p className="flex items-center gap-1 text-[11px] text-nebula-cyan mt-0.5">
              <ClockIcon className="w-3 h-3" /> {countdown}
            </p>
          )}
        </div>

        <div className="min-w-[90px]">
          <ShowStatusPill status={status} />
        </div>

        <div className="min-w-[130px]">
          <OccupancyBar occupied={occupied} capacity={capacity} />
        </div>

        <div className="min-w-[90px] text-xs">
          <p className="font-medium text-nebula-cyan">{currency}{revenue.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500">{currency}{show.showPrice}/seat</p>
        </div>

        <div className="min-w-[64px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-nebula-violet/10 border border-nebula-violet/25 text-nebula-violet">
            <SparklesIcon className="w-2.5 h-2.5" /> {aiScore}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <ActionIconButton icon={EyeIcon} label="View" onClick={() => setExpanded((v) => !v)} />
          <ActionIconButton icon={PencilIcon} label="Edit" onClick={() => onEdit(show)} disabled={show.isCancelled} />
          <ActionIconButton icon={CopyIcon} label="Duplicate" onClick={() => onDuplicate(show)} />
          <ActionIconButton icon={BarChart3Icon} label="Analytics" onClick={() => onAnalytics(show)} />
          {onExportTrailerVote && (
            <ActionIconButton icon={FilmIcon} label="Trailer Vote CSV" onClick={() => onExportTrailerVote(show)} />
          )}
          <ActionIconButton icon={Trash2Icon} label="Delete" danger onClick={() => onDelete(show._id)} disabled={show.isCancelled || savingId === show._id} />
        </div>

        <motion.button
          animate={{ rotate: expanded ? 180 : 0 }}
          onClick={() => setExpanded((v) => !v)}
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer shrink-0"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.015]">
              <DetailTile title="Seat Occupancy" icon={ArmchairIcon}>
                <p className="text-sm font-medium text-gray-200">{occupied} of {capacity || "—"} seats booked</p>
                <OccupancyBar occupied={occupied} capacity={capacity} />
              </DetailTile>

              <DetailTile title="Food & Beverage" icon={PopcornIcon}>
                <p className="text-sm font-medium text-gray-200">Data unavailable</p>
                <p className="text-[11px] text-gray-500">Not tracked per-show yet</p>
              </DetailTile>

              <DetailTile title="Coupon Usage" icon={TicketPercentIcon}>
                <p className="text-sm font-medium text-gray-200">Data unavailable</p>
                <p className="text-[11px] text-gray-500">Not tracked per-show yet</p>
              </DetailTile>

              <DetailTile title="Recent Bookings" icon={UsersIcon}>
                <p className="text-sm font-medium text-gray-200">{occupied} total bookings</p>
                <p className="text-[11px] text-gray-500">{Object.keys(show.occupiedSeats || {}).slice(-3).join(", ") || "None yet"}</p>
              </DetailTile>

              <div className="col-span-2 md:col-span-4">
                <InsightPanel icon={SparklesIcon} title="AI Insight">
                  <div className="text-xs text-gray-300">
                    {capacity > 0 && occupied / capacity < 0.4
                      ? "Occupancy is trending low — consider a price adjustment or promotional push for this slot."
                      : capacity > 0 && occupied / capacity >= 0.85
                        ? "This show is nearly sold out — a great candidate to add another screening."
                        : "Occupancy is on track. No action needed right now."}
                  </div>
                </InsightPanel>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShowRow;
