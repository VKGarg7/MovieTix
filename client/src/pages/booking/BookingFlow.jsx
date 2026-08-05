import React from "react";
import { useParams } from "react-router-dom";
import { BookingFlowProvider, useBookingFlow, STEPS } from "../../context/BookingFlowContext";
import { useAppContext } from "../../context/useAppContext";
import Stepper from "../../components/cinematic/Stepper";
import StepTransition from "../../components/cinematic/StepTransition";
import MovieStep from "./MovieStep";
import TheaterStep from "./TheaterStep";
import DateStep from "./DateStep";
import SeatStep from "./SeatStep";
import FoodStep from "./FoodStep";
import PaymentStep from "./PaymentStep";
import { useEffect } from "react";

const STEP_COMPONENTS = {
  movie: MovieStep,
  theater: TheaterStep,
  date: DateStep,
  seat: SeatStep,
  food: FoodStep,
  payment: PaymentStep,
};

const FlowSeeder = () => {
  const { movieId } = useParams();
  const { shows, selectedTheater } = useAppContext();
  const { state, patch } = useBookingFlow();

  useEffect(() => {
    if (movieId && !state.movie && shows.length > 0) {
      const match = shows.find((s) => s._id === movieId);
      if (match) patch({ movie: match });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, shows]);

  useEffect(() => {
    if (selectedTheater && !state.theater) {
      patch({ theater: selectedTheater });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheater]);

  return null;
};

const FlowBody = () => {
  const { currentStep, stepIndex, direction, goToStep } = useBookingFlow();
  const StepComponent = STEP_COMPONENTS[currentStep];

  const { state } = useBookingFlow();
  const maxReachedIndex = (() => {
    if (!state.movie) return 0;
    if (!state.theater) return 1;
    if (!state.time) return 2;
    if (state.selectedSeats.length === 0) return 3;
    return STEPS.length - 1;
  })();

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-36 pb-32">
      <FlowSeeder />
      <Stepper stepIndex={stepIndex} maxReachedIndex={Math.max(stepIndex, maxReachedIndex)} onStepClick={goToStep} />
      <StepTransition stepKey={currentStep} direction={direction}>
        <StepComponent />
      </StepTransition>
    </div>
  );
};

const BookingFlow = () => (
  <BookingFlowProvider>
    <FlowBody />
  </BookingFlowProvider>
);

export default BookingFlow;
