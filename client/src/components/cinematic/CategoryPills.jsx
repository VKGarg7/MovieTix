import React from "react";
import { motion } from "framer-motion";
import { SPRING_PILL } from "../../lib/motion";
import MagneticButton from "./MagneticButton";

const CategoryPills = ({ options, active, onChange }) => (
  <div className="flex flex-wrap gap-2.5">
    {options.map((option) => {
      const selected = active === option;
      return (
        <MagneticButton
          key={option}
          type="button"
          strength={0.25}
          onClick={() => onChange(option)}
          className="relative"
        >
          {selected && (
            <motion.div
              layoutId="category-pill-border"
              className="absolute -inset-px rounded-full overflow-hidden"
              transition={SPRING_PILL}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: "conic-gradient(from 0deg, #F84565, #FFB86B, #6D5CFF, #3FD8E0, #F84565)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-[1.5px] rounded-full bg-primary/20" />
            </motion.div>
          )}
          <motion.span
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              backgroundColor: selected ? "transparent" : "rgba(255,255,255,0.04)",
              borderColor: selected ? "transparent" : "rgba(255,255,255,0.12)",
            }}
            transition={SPRING_PILL}
            className="relative block px-4 py-2 rounded-full text-sm border cursor-pointer backdrop-blur-xl text-white"
            style={selected ? { boxShadow: "0 0 20px -4px rgba(248,69,101,0.6)" } : undefined}
          >
            {option}
          </motion.span>
        </MagneticButton>
      );
    })}
  </div>
);

export default CategoryPills;
