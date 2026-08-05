import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import SeatGrid, { SeatTypeLegend } from "../../components/SeatGrid";
import PillOptionSelector from "../../components/PillOptionSelector";
import CinemaScreen from "../../components/cinematic/CinemaScreen";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";
import { findBestAvailableSeats } from "../../lib/bestAvailableSeats";

const MAX_SEATS_PER_BOOKING = 5;

const SeatStep = () => {
  const { axios } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();
  const [bestSeatCount, setBestSeatCount] = useState(2);

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
    if (isFullMatch) {
      toast.success(`Best available seats selected: ${seats.join(", ")}`);
    } else {
      toast(`No contiguous block of ${bestSeatCount} seats is available — selected the largest available block instead: ${seats.join(", ")}`);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="self-start">
        <StepHeader step={4} title="Select Your Seats" />
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
          className="px-4 py-1.5 text-xs font-medium bg-primary rounded-full cursor-pointer active:scale-95"
        >
          Best Available Seats
        </button>
      </div>

      <SeatGrid
        rows={state.time?.screen?.rows}
        onSeatClick={handleSeatClick}
        seatState={(seatId) => ({
          selected: state.selectedSeats.includes(seatId),
          disabled: state.occupiedSeats.includes(seatId),
        })}
      />

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
