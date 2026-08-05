import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TicketIcon, XIcon, Building2Icon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";

const QuickBookingWidget = ({ theaters }) => {
  const navigate = useNavigate();
  const { selectedTheater, setSelectedTheater } = useAppContext();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (theater) => {
    setSelectedTheater(theater);
    setExpanded(false);
  };

  const handleBook = () => {
    navigate("/movies");
  };

  return (
    <div className="fixed bottom-8 right-28 z-40 hidden md:block">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-16 right-0 w-72 rounded-2xl border border-white/10 bg-black/85 backdrop-blur-2xl p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Quick Booking</p>
              <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-1.5">
              {theaters.map((theater) => (
                <button
                  key={theater._id}
                  onClick={() => handleSelect(theater)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                    selectedTheater?._id === theater._id ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-300"
                  }`}
                >
                  <Building2Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{theater.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/80 backdrop-blur-2xl p-1.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-gray-200 hover:text-white cursor-pointer transition-colors"
        >
          <Building2Icon className="w-4 h-4" />
          <span className="max-w-32 truncate">{selectedTheater ? selectedTheater.name : "Choose Theater"}</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBook}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-primary text-white cursor-pointer shadow-[0_0_20px_-4px_rgba(248,69,101,0.7)]"
        >
          <TicketIcon className="w-3.5 h-3.5" /> Book
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuickBookingWidget;
