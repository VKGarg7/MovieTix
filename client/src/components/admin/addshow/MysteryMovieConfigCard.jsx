import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOffIcon, TicketIcon, MapPinIcon } from "lucide-react";

const REVEAL_OPTIONS = [
  { value: "onBooking", label: "Reveal on Booking", icon: TicketIcon, desc: "Title & poster shown once a customer books a seat." },
  { value: "atTheater", label: "Reveal at Theater", icon: MapPinIcon, desc: "Stays hidden until the customer is at the theater." },
];

const MysteryMovieConfigCard = ({ isMysteryMovie, onToggle, mysteryRevealAt, onRevealChange }) => (
  <div className="rounded-2xl border border-nebula-violet/20 bg-nebula-violet/[0.04] p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-nebula-violet/15 border border-nebula-violet/30">
          <EyeOffIcon className="w-4 h-4 text-nebula-violet" />
        </span>
        <div>
          <p className="text-sm font-medium">Mystery Movie</p>
          <p className="text-[11px] text-gray-500">Hide the title & poster until reveal</p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => onToggle(!isMysteryMovie)}
        className="relative w-11 h-6 rounded-full cursor-pointer shrink-0"
        style={{ background: isMysteryMovie ? "linear-gradient(90deg, #6D5CFF, #F84565)" : "rgba(255,255,255,0.1)" }}
      >
        <motion.span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: isMysteryMovie ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>

    <AnimatePresence>
      {isMysteryMovie && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="text-[11px] text-gray-500 mt-3 mb-2.5 max-w-md">
            Customers see only genre, runtime, and rating band until reveal — the title and poster stay hidden.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REVEAL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = mysteryRevealAt === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onRevealChange(opt.value)}
                  className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    selected ? "border-nebula-violet/50 bg-nebula-violet/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium mb-1">
                    <Icon className="w-3.5 h-3.5 text-nebula-violet" /> {opt.label}
                  </span>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default MysteryMovieConfigCard;
