import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArmchairIcon, BanknoteIcon, ClockIcon, ListIcon } from "lucide-react";
import { dateFormat } from "../../../lib/dateFomat";

const formatCountdown = (ms) => {
  if (ms <= 0) return "Now showing";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
};

const occupancyTone = (pct) => {
  if (pct >= 75) return { text: "text-nebula-cyan", bar: "from-nebula-cyan to-nebula-violet" };
  if (pct >= 40) return { text: "text-nebula-amber", bar: "from-nebula-amber to-primary" };
  return { text: "text-primary", bar: "from-primary to-primary-dull" };
};

const ActiveShowCard = ({ show, imageBaseUrl, currency, i = 0 }) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = new Date(show.showDateTime).getTime() - now;
  const isSoldOut = show.occupiedCount >= show.totalCapacity && show.totalCapacity > 0;
  const tone = occupancyTone(show.occupancyPct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (i % 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="relative glass-panel overflow-hidden group"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <motion.img
          src={imageBaseUrl + show.movie.poster_path}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
            isSoldOut
              ? "bg-primary/80 border-primary/50 text-white"
              : "bg-nebula-cyan/15 border-nebula-cyan/40 text-nebula-cyan"
          }`}
        >
          {isSoldOut ? "SOLD OUT" : "ON SALE"}
        </span>

        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/60 backdrop-blur-md border border-white/10 text-gray-200">
          <ClockIcon className="w-3 h-3" />
          {formatCountdown(remainingMs)}
        </span>

        <p className="absolute bottom-2 left-2.5 right-2.5 font-medium text-sm truncate">{show.movie.title}</p>
      </div>

      <div className="p-3.5 space-y-2.5">
        <p className="text-[11px] text-gray-500">{dateFormat(show.showDateTime)}</p>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-gray-400">Occupancy</span>
            <span className={`font-medium ${tone.text}`}>{show.occupancyPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${show.occupancyPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-400">
            <ArmchairIcon className="w-3.5 h-3.5" /> {show.seatsSold} sold
          </span>
          <span className="flex items-center gap-1 font-medium text-nebula-cyan">
            <BanknoteIcon className="w-3.5 h-3.5" />
            {currency}
            {show.revenue.toLocaleString()}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/admin/list-shows")}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <ListIcon className="w-3.5 h-3.5" /> Manage
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ActiveShowCard;
