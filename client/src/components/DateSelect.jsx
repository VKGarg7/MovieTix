import React, { useState } from "react";
import BlurCircle from "./BlurCircle";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";

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
    navigate(`/movies/${id}/${selected}`);
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
    <div id="dateSelect" className="pt-30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="100px" right="0px" />

        <div>
          <p className="text-lg font-semibold">Choose Date</p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={28} />
            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
              {Object.keys(dateTime).map((date) => {
                const soldOut = isDateSoldOut(dateTime[date]);
                return (
                  <button
                    onClick={() => setSelected(date)}
                    key={date}
                    className={`relative flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer
                      ${selected === date
                        ? "bg-primary text-white"
                        : "border border-primary/70"
                    }`}
                  >
                    <span>{new Date(date).getDate()}</span>
                    <span>
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    {soldOut && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-semibold px-1 py-0.5 rounded">
                        SOLD OUT
                      </span>
                    )}
                  </button>
                );
              })}
            </span>
            <ChevronRightIcon width={28} />
          </div>

          {selected && isDateSoldOut(dateTime[selected]) && (
            <button
              onClick={handleJoinWaitlist}
              disabled={joiningShowId !== null}
              className="mt-4 px-4 py-2 text-xs border border-primary/40 text-primary rounded-full hover:bg-primary/10 cursor-pointer disabled:opacity-50"
            >
              {joiningShowId ? "Joining..." : "Sold Out — Join Waitlist"}
            </button>
          )}
        </div>

        <button
          onClick={onBookHandler}
          className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
