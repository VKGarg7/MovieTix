import React, { useState } from "react";
import BlurCircle from "./BlurCircle";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import toast from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const onBookHandler = () => {
    if (!selected) {
      return toast("Please select a date");
    }
    navigate(`/movies/${id}/${selected}`);
    scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-30">
      <div className="card-surface flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 rounded-2xl">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="100px" right="0px" />

        <div>
          <p className="text-lg font-semibold tracking-tight">Choose Date</p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={28} className="text-gray-500" />
            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-3">
              {Object.keys(dateTime).map((date) => (
                <button
                  onClick={() => setSelected(date)}
                  key={date}
                  className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded-lg cursor-pointer transition-all duration-200
                    ${selected === date
                      ? "btn-primary text-white"
                      : "border border-white/10 hover:border-primary/50 hover:bg-primary/5 text-gray-300"
                  }`}
                >
                  <span className="font-medium">{new Date(date).getDate()}</span>
                  <span className="text-xs opacity-80">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                </button>
              ))}
            </span>
            <ChevronRightIcon width={28} className="text-gray-500" />
          </div>
        </div>

        <button
          onClick={onBookHandler}
          className="btn-primary text-white px-8 py-3 rounded-full font-medium cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
