import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, FilmIcon, Building2Icon, CalendarDaysIcon, ArmchairIcon, PopcornIcon, CreditCardIcon } from "lucide-react";

const STEP_META = [
  { key: "movie", label: "Movie", icon: FilmIcon },
  { key: "theater", label: "Theater", icon: Building2Icon },
  { key: "date", label: "Date", icon: CalendarDaysIcon },
  { key: "seat", label: "Seat", icon: ArmchairIcon },
  { key: "food", label: "Food", icon: PopcornIcon },
  { key: "payment", label: "Payment", icon: CreditCardIcon },
];

const Stepper = ({ stepIndex, onStepClick, maxReachedIndex }) => {
  return (
    <div className="sticky top-20 z-30 mb-10">
      <div className="glass-panel px-4 md:px-8 py-4 max-w-3xl mx-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max">
          {STEP_META.map((step, i) => {
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            const isReachable = i <= maxReachedIndex;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => isReachable && onStepClick(i)}
                  className={`flex flex-col items-center gap-1.5 shrink-0 px-2 ${isReachable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="relative w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden"
                    style={{
                      borderColor: isDone || isActive ? "#F84565" : "rgba(255,255,255,0.15)",
                      backgroundColor: isDone ? "#F84565" : !isActive ? "rgba(255,255,255,0.06)" : undefined,
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="stepper-active-fill"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="absolute inset-0 bg-primary"
                        style={{ boxShadow: "0 0 20px -4px rgba(248,69,101,0.8)" }}
                      />
                    )}
                    <span className="relative z-10">
                      {isDone ? (
                        <CheckIcon className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                      )}
                    </span>
                  </motion.div>
                  <span className={`text-[11px] tracking-wide ${isActive ? "text-white font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </button>

                {i < STEP_META.length - 1 && (
                  <div className="w-8 md:w-14 h-px bg-white/10 relative shrink-0 -mt-4">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-nebula-amber"
                      initial={false}
                      animate={{ width: i < stepIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stepper;
