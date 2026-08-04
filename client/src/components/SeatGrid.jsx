import React, { useRef, useState } from "react";
import { SEAT_TYPE_META, getSeatTypeMeta } from "../lib/seatTypeMeta";

export const SeatTypeLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-[11px] text-gray-400">
    {Object.entries(SEAT_TYPE_META).map(([type, { label, border, icon: SeatIcon }]) => (
      <div key={type} className="flex items-center gap-1.5">
        <span className={`relative h-4 w-4 rounded border ${border}`}>
          {SeatIcon && <SeatIcon className="absolute inset-0 m-auto w-2.5 h-2.5" />}
        </span>
        {label}
      </div>
    ))}
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

  // Only one seat is in the natural tab order (roving tabindex): the
  // currently-focused seat if set, otherwise the very first seat.
  const defaultFocusSeatId = flatSeats[0]?.[0];

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div
        role="grid"
        aria-label="Seat map"
        className="flex flex-col items-center mt-10 text-xs text-gray-300 gap-1 max-h-[60vh] overflow-y-auto py-1 w-max mx-auto"
      >
        {seatRows.map((row) => {
          const { label, border, icon: SeatIcon } = getSeatTypeMeta(row.seatType);
          const isAccessible = row.seatType === "accessible";

          return (
            <div key={row.label} role="row" className="flex items-center gap-3 mt-2">
              <span className="w-4 shrink-0 text-gray-500" aria-hidden="true">{row.label}</span>
              <div className="flex flex-nowrap items-center gap-2">
                {Array.from({ length: row.seatCount }, (_, i) => {
                  const seatId = `${row.label}${i + 1}`;
                  const { selected, disabled, extraClass } = seatState(seatId);
                  const stateLabel = seatStateLabel(selected, disabled);
                  const isTabStop = (focusedSeatId || defaultFocusSeatId) === seatId;

                  return (
                    <button
                      key={seatId}
                      ref={(el) => { buttonRefs.current[seatId] = el; }}
                      role="gridcell"
                      type="button"
                      tabIndex={isTabStop ? 0 : -1}
                      disabled={disabled}
                      aria-label={`Seat ${seatId}, ${label.toLowerCase()}, ${stateLabel}`}
                      aria-selected={selected}
                      onFocus={() => {
                        setFocusedSeatId(seatId);
                        onSeatPreview?.(seatId, row);
                      }}
                      onMouseEnter={() => onSeatPreview?.(seatId, row)}
                      onClick={() => !disabled && onSeatClick(seatId)}
                      onKeyDown={(e) => handleKeyDown(e, seatId, disabled)}
                      title={`${seatId} — ${label}`}
                      className={`relative h-8 w-8 shrink-0 rounded border flex items-center justify-center text-[10px]
                      cursor-pointer disabled:cursor-not-allowed disabled:opacity-40
                      ${border}
                      ${selected ? "bg-primary text-white" : ""}
                      ${extraClass || ""}
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                    >
                      {seatId}
                      {SeatIcon && (
                        <SeatIcon
                          aria-hidden="true"
                          className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#1f1f24] rounded-full p-0.5 box-content
                          ${isAccessible ? "text-sky-300" : ""}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Polite live region: announces the most recent selection change
          without interrupting in-progress screen-reader speech, avoiding
          overlapping/garbled announcements during fast arrow-key navigation
          (focus-driven aria-label changes are what convey per-seat state as
          the user tabs/arrows around; this region only speaks on selection). */}
      <p className="sr-only" role="status" aria-live="polite">
        {focusedSeatId && seatState(focusedSeatId).selected ? `Seat ${focusedSeatId} selected` : ""}
      </p>
    </div>
  );
};

export default SeatGrid;
