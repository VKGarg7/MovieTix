import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BookingFlowProvider, useBookingFlow } from "../../context/BookingFlowContext";
import { STEPS } from "../../context/bookingFlowSteps";
import { useAppContext } from "../../context/useAppContext";
import Stepper from "../../components/cinematic/Stepper";
import StepTransition from "../../components/cinematic/StepTransition";
import BookingSidebar from "../../components/cinematic/BookingSidebar";
import MovieStep from "./MovieStep";
import TheaterStep from "./TheaterStep";
import DateStep from "./DateStep";
import SeatStep from "./SeatStep";
import FoodStep from "./FoodStep";
import PaymentStep from "./PaymentStep";
import Loading from "../../components/Loading";

const STEP_COMPONENTS = {
  movie: MovieStep,
  theater: TheaterStep,
  date: DateStep,
  seat: SeatStep,
  food: FoodStep,
  payment: PaymentStep,
};

const FlowSeeder = ({ onReady }) => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const { shows, selectedTheater, fetchShowDetails } = useAppContext();
  const { state, patch, goToStep } = useBookingFlow();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    if (!movieId) return;

    if (shows.length === 0) {
      const timer = setTimeout(() => {
        if (!seededRef.current) {
          seededRef.current = true;
          onReady();
        }
      }, 4000);
      return () => clearTimeout(timer);
    }

    const match = state.movie?._id === movieId ? state.movie : shows.find((s) => s._id === movieId);
    if (!match) {
      seededRef.current = true;
      onReady();
      return;
    }

    const theater = state.theater || selectedTheater;
    const dateParam = searchParams.get("date");
    const showIdParam = searchParams.get("showId");

    if (!theater) {
      seededRef.current = true;
      patch({ movie: match });
      onReady();
      return;
    }

    if (!dateParam) {
      seededRef.current = true;
      patch({ movie: match, theater });
      goToStep(STEPS.indexOf("theater"));
      onReady();
      return;
    }

    seededRef.current = true;
    (async () => {
      const data = await fetchShowDetails(match._id, theater._id);
      const showtimesForDate = data?.dateTime?.[dateParam] || [];
      const time = showIdParam
        ? showtimesForDate.find((s) => s.showId === showIdParam)
        : null;

      patch({
        movie: match,
        theater,
        show: data,
        date: dateParam,
        time: time || null,
      });
      goToStep(STEPS.indexOf(time ? "seat" : "date"));
      onReady();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, shows, selectedTheater]);

  return null;
};

const FlowBody = () => {
  const { movieId } = useParams();
  const { currentStep, stepIndex, direction, goToStep, state } = useBookingFlow();
  const [seeding, setSeeding] = useState(Boolean(movieId));
  const StepComponent = STEP_COMPONENTS[currentStep];

  const maxReachedIndex = (() => {
    if (!state.movie) return 0;
    if (!state.theater) return 1;
    if (!state.time) return 2;
    if (state.selectedSeats.length === 0) return 3;
    return STEPS.length - 1;
  })();

  return (
    <div className="px-6 md:px-10 lg:px-16 xl:px-24 pt-36 pb-40 lg:pb-24">
      {movieId && <FlowSeeder onReady={() => setSeeding(false)} />}
      {seeding ? (
        <Loading />
      ) : (
        <>
          <Stepper stepIndex={stepIndex} maxReachedIndex={Math.max(stepIndex, maxReachedIndex)} onStepClick={goToStep} />
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto items-start">
            <div className="flex-1 min-w-0 w-full">
              <StepTransition stepKey={currentStep} direction={direction}>
                <StepComponent />
              </StepTransition>
            </div>
            <BookingSidebar />
          </div>
        </>
      )}
    </div>
  );
};

const BookingFlow = () => (
  <BookingFlowProvider>
    <FlowBody />
  </BookingFlowProvider>
);

export default BookingFlow;
