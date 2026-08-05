import React, { useRef, useState } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { SEAT_TYPE_META, getSeatTypeMeta } from "../lib/seatTypeMeta";
import Seat, { SEAT_LIGHTING } from "./cinematic/Seat";

export const SeatTypeLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-[11px] text-gray-400">
    {Object.entries(SEAT_TYPE_META).map(([type, { label, border, icon: SeatIcon }]) => {
      const lighting = SEAT_LIGHTING[type] || SEAT_LIGHTING.regular;
      return (
        <div key={type} className="flex items-center gap-1.5">
          <span
            className={`relative h-4 w-4 rounded border ${border}`}
            style={{ boxShadow: `0 0 8px -1px ${lighting.glow}` }}
          >
            {SeatIcon && <SeatIcon className="absolute inset-0 m-auto w-2.5 h-2.5" />}
          </span>
          {label}
        </div>
      );
    })}
  </div>
);

const seatStateLabel = (selected, disabled) => {
  if (disabled) return "occupied";
  if (selected) return "selected";
  return "available";
};

const SeatGrid = ({ rows, onSeatClick, seatState, onSeatPreview }) => {
  const seatRows = rows || [];
  const buttonRefs = useRef({});
  const [focusedSeatId, setFocusedSeatId] = useState(null);

  const containerRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20, mass: 0.8 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), springConfig);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const flatSeats = seatRows.map((row) =>
    Array.from({ length: row.seatCount }, (_, i) => `${row.label}${i + 1}`)
  );

  const currentPosition = (seatId) => {
    for (let r = 0; r < flatSeats.length; r++) {
      const c = flatSeats[r].indexOf(seatId);
      if (c !== -1) return { r, c };
    }
    return null;
  };

  const focusSeat = (seatId) => {
    setFocusedSeatId(seatId);
    buttonRefs.current[seatId]?.focus();
  };

  const handleKeyDown = (event, seatId, disabled) => {
    const pos = currentPosition(seatId);
    if (!pos) return;
    const { r, c } = pos;

    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        const row = flatSeats[r];
        const next = row[Math.min(c + 1, row.length - 1)];
        focusSeat(next);
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        const row = flatSeats[r];
        const next = row[Math.max(c - 1, 0)];
        focusSeat(next);
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const nextRow = flatSeats[Math.min(r + 1, flatSeats.length - 1)];
        focusSeat(nextRow[Math.min(c, nextRow.length - 1)]);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prevRow = flatSeats[Math.max(r - 1, 0)];
        focusSeat(prevRow[Math.min(c, prevRow.length - 1)]);
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (!disabled) onSeatClick(seatId);
        break;
      default:
        break;
    }
  };

  const defaultFocusSeatId = flatSeats[0]?.[0];

  return (
    <div className="w-full max-w-full overflow-x-auto no-scrollbar">
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        role="grid"
        aria-label="Seat map"
        className="flex flex-col items-center mt-10 text-xs text-gray-300 gap-1.5 max-h-[60vh] overflow-y-auto no-scrollbar py-1 w-max mx-auto"
      >
        {seatRows.map((row) => {
          const { label, icon: SeatIcon } = getSeatTypeMeta(row.seatType);
          const isAccessible = row.seatType === "accessible";

          return (
            <div key={row.label} role="row" className="flex items-center gap-3 mt-2">
              <span className="w-4 shrink-0 text-gray-500" aria-hidden="true">{row.label}</span>
              <div className="flex flex-nowrap items-center gap-2.5">
                {Array.from({ length: row.seatCount }, (_, i) => {
                  const seatId = `${row.label}${i + 1}`;
                  const { selected, disabled, extraClass } = seatState(seatId);
                  const stateLabel = seatStateLabel(selected, disabled);
                  const isTabStop = (focusedSeatId || defaultFocusSeatId) === seatId;

                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      seatType={row.seatType}
                      selected={selected}
                      disabled={disabled}
                      extraClass={extraClass}
                      Icon={SeatIcon}
                      isAccessible={isAccessible}
                      tabIndex={isTabStop ? 0 : -1}
                      ariaLabel={`Seat ${seatId}, ${label.toLowerCase()}, ${stateLabel}`}
                      ariaSelected={selected}
                      buttonRef={(el) => { buttonRefs.current[seatId] = el; }}
                      onFocus={() => {
                        setFocusedSeatId(seatId);
                        onSeatPreview?.(seatId, row);
                      }}
                      onMouseEnter={() => onSeatPreview?.(seatId, row)}
                      onClick={() => onSeatClick(seatId)}
                      onKeyDown={(e) => handleKeyDown(e, seatId, disabled)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

      <p className="sr-only" role="status" aria-live="polite">
        {focusedSeatId && seatState(focusedSeatId).selected ? `Seat ${focusedSeatId} selected` : ""}
      </p>
    </div>
  );
};

export default SeatGrid;
