import React, { useState } from "react";
import { motion } from "framer-motion";

const MorphButton = ({ children, icon: Icon, className = "", ...props }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.95, borderRadius: "18px" }}
      animate={{ borderRadius: hovered ? "14px" : "999px" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative inline-flex items-center gap-2 px-7 py-3.5 font-medium border border-white/10 overflow-hidden cursor-pointer ${className}`}
      {...props}
    >
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-primary via-nebula-amber to-nebula-violet"
        initial={{ x: "-100%" }}
        animate={{ x: hovered ? "0%" : "-100%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {Icon && (
          <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Icon className="w-4 h-4" />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
};

export default MorphButton;
