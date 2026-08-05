import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, FilmIcon, Building2Icon, MonitorPlayIcon, BanknoteIcon, EyeOffIcon } from "lucide-react";

const PreviewModal = ({ open, onClose, movie, theater, screen, showPrice, dateTimeSelection, isMysteryMovie, mysteryRevealAt, currency, imageBaseUrl }) => {
  const totalScreenings = Object.values(dateTimeSelection).reduce((sum, times) => sum + times.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg glass-panel p-6 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-black/80 border border-white/10 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>

            <p className="section-eyebrow mb-4">This will be published</p>

            <div className="flex gap-4 mb-5">
              {movie?.poster_path && (
                <img
                  src={imageBaseUrl + movie.poster_path}
                  alt=""
                  className="w-20 h-28 rounded-xl object-cover shrink-0"
                />
              )}
              <div>
                <p className="font-display text-xl font-medium">{isMysteryMovie ? "Mystery Movie" : movie?.title}</p>
                {isMysteryMovie && (
                  <p className="flex items-center gap-1 text-xs text-nebula-violet mt-1">
                    <EyeOffIcon className="w-3 h-3" /> Reveals {mysteryRevealAt === "onBooking" ? "on booking" : "at theater"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-sm mb-5">
              <p className="flex items-center gap-2 text-gray-300">
                <Building2Icon className="w-4 h-4 text-gray-500" /> {theater?.name} · {theater?.city}
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <MonitorPlayIcon className="w-4 h-4 text-gray-500" /> {screen?.name} ({screen?.totalCapacity} seats)
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <BanknoteIcon className="w-4 h-4 text-gray-500" /> {currency}{showPrice} base price
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-2">{totalScreenings} screening{totalScreenings === 1 ? "" : "s"} scheduled</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {Object.entries(dateTimeSelection).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => (
                <div key={date} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-24 shrink-0">{date}</span>
                  <span className="text-gray-300">{times.sort().join(", ")}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
