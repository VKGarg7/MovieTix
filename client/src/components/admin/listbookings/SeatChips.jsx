import React from "react";

const SeatChips = ({ seats, max = 4 }) => {
  const shown = seats.slice(0, max);
  const rest = seats.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((seat) => (
        <span key={seat} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-nebula-violet/10 border border-nebula-violet/25 text-nebula-violet">
          {seat}
        </span>
      ))}
      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-gray-400">
          +{rest}
        </span>
      )}
    </div>
  );
};

export default SeatChips;
