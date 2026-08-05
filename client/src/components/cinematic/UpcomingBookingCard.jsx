import React from "react";
import { motion } from "framer-motion";
import { CalendarDaysIcon, ArmchairIcon, TicketIcon } from "lucide-react";
import { dateFormat } from "../../lib/dateFomat";

const UpcomingBookingCard = ({ booking, imageBaseUrl, onView }) => {
  if (!booking?.show?.movie) return null;
  const { movie } = booking.show;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative flex gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle at 0% 0%, rgba(109,92,255,0.18), transparent 60%)" }}
      />
      <img
        src={imageBaseUrl + movie.poster_path}
        alt=""
        loading="lazy"
        decoding="async"
        className="relative w-14 h-20 rounded-xl object-cover shrink-0"
      />
      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{movie.title}</p>
        <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
          <CalendarDaysIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">{dateFormat(booking.show.showDateTime)}</span>
        </p>
        {booking.bookedSeats?.length > 0 && (
          <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
            <ArmchairIcon className="w-3 h-3 shrink-0" />
            {booking.bookedSeats.join(", ")}
          </p>
        )}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onView}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
        >
          <TicketIcon className="w-3 h-3" /> View Ticket
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UpcomingBookingCard;
