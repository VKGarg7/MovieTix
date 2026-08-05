import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, FilmIcon, MapPinIcon, Building2Icon, CalendarDaysIcon, ArmchairIcon, CreditCardIcon } from "lucide-react";

const STEPS = [
  { key: "movie", label: "Movie", icon: FilmIcon },
  { key: "city", label: "City", icon: MapPinIcon },
  { key: "theater", label: "Theater", icon: Building2Icon },
  { key: "showtime", label: "Showtime", icon: CalendarDaysIcon },
  { key: "seats", label: "Seats", icon: ArmchairIcon },
  { key: "payment", label: "Payment", icon: CreditCardIcon },
];

const ConciergeStepper = ({ stepIndex }) => (
  <div className="flex items-center px-1 py-3 overflow-x-auto no-scrollbar">
    {STEPS.map((step, i) => {
      const isDone = i < stepIndex;
      const isActive = i === stepIndex;
      const Icon = step.icon;

      return (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1 shrink-0 px-1">
            <motion.div
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="relative w-6 h-6 rounded-full border flex items-center justify-center"
              style={{
                borderColor: isDone || isActive ? "#F84565" : "rgba(255,255,255,0.15)",
                backgroundColor: isDone ? "#F84565" : "rgba(255,255,255,0.06)",
                boxShadow: isActive ? "0 0 14px -2px rgba(248,69,101,0.8)" : "none",
              }}
            >
              {isDone ? <CheckIcon className="w-3 h-3 text-white" /> : <Icon className="w-3 h-3 text-gray-300" />}
            </motion.div>
            <span className={`text-[9px] tracking-wide ${isActive ? "text-white" : "text-gray-500"}`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-4 h-px bg-white/10 relative shrink-0 -mt-3">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary"
                initial={false}
                animate={{ width: i < stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default ConciergeStepper;
