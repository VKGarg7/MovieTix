import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const TimeRangeSlider = ({ startHour, endHour, onChange }) => {
  const trackRef = useRef(null);

  const hourFromClientX = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    return Math.round(pct * 24);
  }, []);

  const startDrag = (which) => (e) => {
    e.preventDefault();
    const move = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const hour = hourFromClientX(clientX);
      if (which === "start") {
        onChange({ startHour: clamp(hour, 0, endHour - 1), endHour });
      } else {
        onChange({ startHour, endHour: clamp(hour, startHour + 1, 24) });
      }
    };
    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", stop);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", stop);
  };

  const startPct = (startHour / 24) * 100;
  const endPct = (endHour / 24) * 100;

  return (
    <div className="pt-2 pb-1">
      <div className="flex justify-between text-xs text-gray-300 mb-2 font-medium tabular-nums">
        <span>{String(startHour).padStart(2, "0")}:00</span>
        <span>{String(endHour).padStart(2, "0")}:00</span>
      </div>
      <div ref={trackRef} className="relative h-2 rounded-full bg-white/8 select-none">
        <motion.div
          className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-primary to-nebula-violet"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />
        {[
          { which: "start", pct: startPct },
          { which: "end", pct: endPct },
        ].map(({ which, pct }) => (
          <div
            key={which}
            onMouseDown={startDrag(which)}
            onTouchStart={startDrag(which)}
            className="absolute top-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-lg cursor-grab active:cursor-grabbing"
            style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
          />
        ))}
      </div>
    </div>
  );
};

export default TimeRangeSlider;
