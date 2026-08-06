import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { ZoomInIcon, ZoomOutIcon, SparklesIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import SeatGrid, { SeatTypeLegend } from "../../components/SeatGrid";
import PillOptionSelector from "../../components/PillOptionSelector";
import CinemaScreen from "../../components/cinematic/CinemaScreen";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";
import { findBestAvailableSeats } from "../../lib/bestAvailableSeats";
import { getSeatTypeMeta } from "../../lib/seatTypeMeta";

const MAX_SEATS_PER_BOOKING = 5;
const ZOOM_LEVELS = [0.8, 1, 1.2, 1.4];

const currency = import.meta.env.VITE_CURRENCY;

const SeatStep = () => {
  const { axios } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();
  const [bestSeatCount, setBestSeatCount] = useState(2);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [justAutoSelected, setJustAutoSelected] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/booking/seats/${state.time.showId}`);
        if (data.success) {
          patch({ occupiedSeats: data.occupiedSeats });
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (state.time) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.time]);

  const handleSeatClick = (seatId) => {
    if (!state.selectedSeats.includes(seatId) && state.selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      return toast(`You can only select ${MAX_SEATS_PER_BOOKING} seats`);
    }
    if (state.occupiedSeats.includes(seatId)) {
      return toast("This seat is already occupied");
    }
    setJustAutoSelected(false);
    patch({
      selectedSeats: state.selectedSeats.includes(seatId)
        ? state.selectedSeats.filter((s) => s !== seatId)
        : [...state.selectedSeats, seatId],
    });
  };

  const handleFindBestSeats = () => {
    const rows = state.time.screen?.rows || [];
    const { seats, isFullMatch } = findBestAvailableSeats(rows, bestSeatCount, state.occupiedSeats);

    if (seats.length === 0) {
      return toast.error("No available seats found for this showtime");
    }
    patch({ selectedSeats: seats });
    setJustAutoSelected(true);
    if (isFullMatch) {
      toast.success(`Best available seats selected: ${seats.join(", ")}`);
    } else {
      toast(`No contiguous block of ${bestSeatCount} seats is available — selected the largest available block instead: ${seats.join(", ")}`);
    }
  };

  const rows = state.time?.screen?.rows || [];
  const hoveredRow = hoveredSeat ? rows.find((r) => r.label === hoveredSeat[0]) : null;
  const hoveredMeta = hoveredRow ? getSeatTypeMeta(hoveredRow.seatType) : null;
  const pricePerSeat = state.time?.computedPrice ?? state.time?.showPrice ?? 0;
  const ticketTotal = pricePerSeat * state.selectedSeats.length;

  return (
    <div className="flex flex-col items-center">
      <div className="self-start w-full flex items-center justify-between flex-wrap gap-3">
        <StepHeader step={4} title="Select Your Seats" />
        <div className="flex items-center gap-1.5 mb-8">
          <button
            onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
            disabled={zoomIndex === 0}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
          >
            <ZoomOutIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
          >
            <ZoomInIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CinemaScreen />

      <SeatTypeLegend />

      <div className="flex flex-col items-center gap-2 mt-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Seats:</span>
          <PillOptionSelector
            options={Array.from({ length: MAX_SEATS_PER_BOOKING }, (_, i) => i + 1)}
            value={bestSeatCount}
            onChange={setBestSeatCount}
            circular
          />
        </div>
        <button
          onClick={handleFindBestSeats}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-primary rounded-full cursor-pointer active:scale-95 hover:bg-primary-dull transition-colors"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          Best Available Seats
        </button>
        <AnimatePresence>
          {justAutoSelected && state.selectedSeats.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-nebula-cyan text-center max-w-xs"
            >
              Recommended seats selected based on view and availability
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-4">
        <motion.div
          animate={{ scale: ZOOM_LEVELS[zoomIndex] }}
          transition={{ type: "spring", stiffness: 250, damping: 26 }}
          style={{ transformOrigin: "top center" }}
        >
          <SeatGrid
            rows={rows}
            onSeatClick={handleSeatClick}
            seatState={(seatId) => ({
              selected: state.selectedSeats.includes(seatId),
              disabled: state.occupiedSeats.includes(seatId),
            })}
            onSeatPreview={(seatId) => setHoveredSeat(seatId)}
          />
        </motion.div>

        <AnimatePresence>
          {hoveredSeat && hoveredMeta && !state.occupiedSeats.includes(hoveredSeat) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 glass-panel px-4 py-2 text-xs whitespace-nowrap z-10"
            >
              <span className="font-medium">Seat {hoveredSeat}</span>
              <span className="text-gray-400"> · {hoveredMeta.label} · {currency}{pricePerSeat}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* live summary */}
      <AnimatePresence>
        {state.selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-panel mt-8 p-5 w-full max-w-sm self-center"
          >
            <p className="text-xs text-gray-400 mb-2">Selected seats</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {state.selectedSeats.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-primary/20 border border-primary/40 text-primary font-medium">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-sm text-gray-400">Total</span>
              <motion.span key={ticketTotal} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="text-lg font-semibold">
                {currency}{ticketTotal}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StepNav
        onBack={back}
        onContinue={next}
        continueLabel="Continue to Food"
        disabled={state.selectedSeats.length === 0}
        className="mt-10 self-start"
      />
    </div>
  );
};

export default SeatStep;
