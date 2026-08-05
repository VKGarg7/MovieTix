import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const variants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 60 : -60, filter: "blur(6px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -60 : 60, filter: "blur(6px)" }),
};

const StepTransition = ({ stepKey, direction, children }) => (
  <AnimatePresence mode="wait" custom={direction}>
    <motion.div
      key={stepKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default StepTransition;
