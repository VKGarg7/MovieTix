import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";
import RevealSection from "./cinematic/RevealSection";

const isDateSoldOut = (showtimes) => showtimes.every((s) => s.isSoldOut);

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [selected, setSelected] = useState(null);
  const [joiningShowId, setJoiningShowId] = useState(null);

  const onBookHandler = () => {
    if (!selected) {
      return toast("Please select a date");
    }
    if (isDateSoldOut(dateTime[selected])) {
      return toast("All showtimes on this date are sold out — join the waitlist below");
    }
    navigate(`/book/${id}?date=${selected}`);
    scrollTo(0, 0);
  };

  const handleJoinWaitlist = async () => {
    if (!user) return toast.error("Please login to join the waitlist");
    const showtimes = dateTime[selected];
    const showId = showtimes[0].showId;

    setJoiningShowId(showId);
    try {
      const { data } = await axios.post(
        "/api/waitlist/join",
        { showId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`You're #${data.position} on the waitlist — we'll email you if a seat opens up!`);
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "ALREADY_ON_WAITLIST") {
        toast.error("You're already on the waitlist for this show");
      } else {
        toast.error(error.response?.data?.message || "Failed to join waitlist");
      }
    }
    setJoiningShowId(null);
  };

  return (
    <RevealSection id="dateSelect" className="pt-10">
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-10 p-8 md:p-10 glass-panel overflow-hidden">
        <div
          className="absolute -inset-24 opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 20% 30%, rgba(248,69,101,0.25), transparent 60%)" }}
        />

        <div className="relative z-10 w-full">
          <p className="text-lg font-display font-medium flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-primary" />
            Choose Date
          </p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={24} className="text-gray-500 shrink-0" />
            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-3">
              {Object.keys(dateTime).map((date) => {
                const soldOut = isDateSoldOut(dateTime[date]);
                const isSelected = selected === date;
                return (
                  <motion.button
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelected(date)}
                    key={date}
                    className={`relative flex flex-col items-center justify-center h-14 w-14 aspect-square rounded-2xl cursor-pointer transition-all duration-300 border ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-[0_0_25px_-5px_rgba(248,69,101,0.8)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/25"
                    }`}
                  >
                    <span className="font-medium">{new Date(date).getDate()}</span>
                    <span className="text-[10px] uppercase tracking-wide">
                      {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    {soldOut && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-semibold px-1 py-0.5 rounded">
                        SOLD OUT
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </span>
            <ChevronRightIcon width={24} className="text-gray-500 shrink-0" />
          </div>

          {selected && isDateSoldOut(dateTime[selected]) && (
            <button
              onClick={handleJoinWaitlist}
              disabled={joiningShowId !== null}
              className="mt-4 px-4 py-2 text-xs border border-primary/40 text-primary rounded-full hover:bg-primary/10 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {joiningShowId ? "Joining..." : "Sold Out — Join Waitlist"}
            </button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBookHandler}
          className="relative z-10 btn-glow shrink-0 px-10 py-3.5 rounded-full font-medium cursor-pointer border border-white/10"
        >
          Book Now
        </motion.button>
      </div>
    </RevealSection>
  );
};

export default DateSelect;
