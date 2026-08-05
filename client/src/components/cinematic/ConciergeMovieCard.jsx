import React, { useState } from "react";
import { motion } from "framer-motion";
import { TicketIcon, PlayIcon, Building2Icon, ArmchairIcon } from "lucide-react";
import CircularRating from "./CircularRating";
import TrailerModal from "./TrailerModal";
import isoTimeFormat from "../../lib/isoTimeFormat";

const ConciergeMovieCard = ({ movie, theaterName, showtimes = [], trailerUrl, imageBaseUrl, onBook, onViewDetails, i = 0 }) => {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const topShowtimes = showtimes.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-white/20 transition-colors"
    >
      <div className="flex gap-3 p-3">
        <button onClick={onViewDetails} className="relative shrink-0 w-20 h-28 rounded-xl overflow-hidden cursor-pointer group/poster">
          <img
            src={imageBaseUrl + movie.poster_path}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
          />
          {trailerUrl && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setTrailerOpen(true);
              }}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center"
            >
              <PlayIcon className="w-5 h-5 fill-white text-white" />
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button onClick={onViewDetails} className="text-left cursor-pointer">
              <p className="text-sm font-medium truncate">{movie.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {movie.genres?.slice(0, 2).map((g) => g.name).join(" · ")}
              </p>
            </button>
            <CircularRating value={movie.vote_average ?? 0} size={32} />
          </div>

          {theaterName && (
            <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5">
              <Building2Icon className="w-3 h-3" /> {theaterName}
            </p>
          )}

          {topShowtimes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {topShowtimes.map((s) => {
                const seatsLeft = s.totalCapacity ? s.totalCapacity - s.occupiedCount : null;
                const lowSeats = seatsLeft !== null && seatsLeft <= 10 && seatsLeft > 0;
                return (
                  <span
                    key={s.showId}
                    className={`px-2 py-1 rounded-lg text-[11px] border ${
                      s.isSoldOut
                        ? "border-white/5 text-gray-600 line-through"
                        : lowSeats
                        ? "border-nebula-amber/40 text-nebula-amber bg-nebula-amber/10"
                        : "border-white/10 text-gray-300 bg-white/5"
                    }`}
                  >
                    {isoTimeFormat(s.time)}
                    {!s.isSoldOut && seatsLeft !== null && (
                      <span className="opacity-70"> · {seatsLeft} left</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBook}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium border-t border-white/10 bg-gradient-to-r from-primary/20 to-nebula-violet/20 hover:from-primary/30 hover:to-nebula-violet/30 transition-colors cursor-pointer"
      >
        <TicketIcon className="w-3.5 h-3.5" />
        Book This Show
        {topShowtimes.some((s) => !s.isSoldOut) && (
          <span className="flex items-center gap-1 text-gray-400 font-normal">
            <ArmchairIcon className="w-3 h-3" /> seats available
          </span>
        )}
      </motion.button>

      {trailerUrl && <TrailerModal open={trailerOpen} onClose={() => setTrailerOpen(false)} videoUrl={trailerUrl} />}
    </motion.div>
  );
};

export default ConciergeMovieCard;
