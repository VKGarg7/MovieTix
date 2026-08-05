import React, { createContext, useContext, useMemo, useState } from "react";
const BookingFlowContext = createContext(null);
import { STEPS } from "./bookingFlowSteps";

const initialState = {
  movie: null, 
  show: null, 
  theater: null,
  date: null, 
  time: null, 
  selectedSeats: [],
  occupiedSeats: [],
  snackQuantities: {}, 
  menuItems: [],
};

export const BookingFlowProvider = ({ children }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [state, setState] = useState(initialState);

  const patch = (fields) => setState((prev) => ({ ...prev, ...fields }));

  const goToStep = (index) => {
    setDirection(index >= stepIndex ? 1 : -1);
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  };

  const next = () => goToStep(stepIndex + 1);
  const back = () => goToStep(stepIndex - 1);

  const reset = () => {
    setState(initialState);
    setStepIndex(0);
    setDirection(1);
  };

  const value = useMemo(
    () => ({
      state,
      patch,
      stepIndex,
      currentStep: STEPS[stepIndex],
      direction,
      goToStep,
      next,
      back,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, stepIndex, direction]
  );

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
};

export const useBookingFlow = () => {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within BookingFlowProvider");
  return ctx;
};
