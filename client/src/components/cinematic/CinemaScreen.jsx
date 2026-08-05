import React from "react";
import { motion } from "framer-motion";

const CinemaScreen = () => (
  <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center select-none">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full flex flex-col items-center"
      style={{ perspective: 800 }}
    >
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[120%] h-40 blur-3xl opacity-70 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(63,216,224,0.35), transparent 70%)" }}
      />
      <motion.div
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-[90%] h-24 blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4), transparent 75%)" }}
      />

      <div
        className="relative w-[85%] h-6 md:h-8 rounded-[50%] border border-white/20"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(200,220,255,0.3))",
          boxShadow: "0 0 60px 10px rgba(255,255,255,0.35), 0 0 120px 30px rgba(63,216,224,0.25)",
          transform: "rotateX(55deg)",
        }}
      />
    </motion.div>

    <p className="section-eyebrow mt-6 mb-8">Screen This Way</p>
  </div>
);

export default CinemaScreen;
