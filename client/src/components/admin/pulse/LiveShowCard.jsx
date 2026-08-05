import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ArmchairIcon, BanknoteIcon, EyeIcon, PlayIcon, BarChart3Icon, BellRingIcon } from "lucide-react";
import { occupancyTier, getLiveStatus, getStatusMeta } from "../../../lib/pulseStatus";
import CircularGauge from "./CircularGauge";
import { dateFormat } from "../../../lib/dateFomat";
import ActionIconButton from "../ActionIconButton";

const buildSyntheticTrend = (occupancyPct, seed) => {
  const pct = occupancyPct ?? 0;
  const points = 8;
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const noise = Math.sin(seed + i * 1.7) * 6;
    return { i, v: Math.max(0, Math.min(100, pct * progress + noise)) };
  });
};

const LiveShowCard = ({ show, i, currency, imageBaseUrl, now, onViewSeats, onOpenShow, onAnalytics, onNotifyStaff }) => {
  const tier = occupancyTier(show.occupancyPct);
  const status = getLiveStatus(show, now);
  const statusMeta = getStatusMeta(status);
  const trendData = useMemo(() => buildSyntheticTrend(show.occupancyPct, i), [show.occupancyPct, i]);
  const pct = show.occupancyPct ?? 0;

  const timelineSlots = ["10 AM", "12 PM", "2 PM", "Now"];
  const activeSlotIndex = timelineSlots.length - 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(i, 12) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative rounded-3xl border border-white/10 bg-white/[0.02] hover:border-white/20 overflow-hidden transition-colors"
    >
      <div className="relative h-32 w-full overflow-hidden">
        {show.poster_path ? (
          <motion.img
            src={imageBaseUrl + show.poster_path}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-nebula-violet/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${statusMeta.cls}`}>
          {statusMeta.label}
        </span>

        <div className="absolute top-2 right-2">
          <CircularGauge pct={show.occupancyPct} color={tier.color} />
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="font-medium text-sm truncate">{show.title}</p>
          <p className="text-[11px] text-gray-400 truncate">{show.screenName} · {show.theaterName || "—"}</p>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        <p className="text-[11px] text-gray-500">{dateFormat(show.showDateTime)}</p>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-gray-400">Occupancy</span>
            <span className="font-medium tabular-nums" style={{ color: tier.color }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${tier.from}, ${tier.to})` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, pct)}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-400">
            <ArmchairIcon className="w-3.5 h-3.5" /> {show.occupiedCount}/{show.totalCapacity ?? "?"}
          </span>
          <span className="flex items-center gap-1 font-medium text-nebula-cyan">
            <BanknoteIcon className="w-3.5 h-3.5" />
            {currency}{Math.round(show.revenue || 0).toLocaleString()}
          </span>
        </div>

        <div className="h-8 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line type="monotone" dataKey="v" stroke={tier.color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 mb-1">Booking Progress</p>
          <div className="flex items-center">
            {timelineSlots.map((slot, idx) => (
              <React.Fragment key={slot}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${idx <= activeSlotIndex ? "bg-nebula-cyan" : "bg-white/15"}`} />
                  <span className="text-[9px] text-gray-500">{slot}</span>
                </div>
                {idx < timelineSlots.length - 1 && <div className={`h-px flex-1 mx-1 ${idx < activeSlotIndex ? "bg-nebula-cyan/40" : "bg-white/10"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIconButton icon={EyeIcon} label="View Seats" onClick={() => onViewSeats(show)} />
          <ActionIconButton icon={PlayIcon} label="Open Show" onClick={() => onOpenShow(show)} />
          <ActionIconButton icon={BarChart3Icon} label="Analytics" onClick={() => onAnalytics(show)} />
          <ActionIconButton icon={BellRingIcon} label="Notify Staff" onClick={() => onNotifyStaff(show)} />
        </div>
      </div>
    </motion.div>
  );
};

export default LiveShowCard;
