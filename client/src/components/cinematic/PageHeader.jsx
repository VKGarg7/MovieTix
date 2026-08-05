import React from "react";
import { motion } from "framer-motion";
import { FADE_UP } from "../../lib/motion";

const PageHeader = ({ eyebrow, title, className = "mb-8" }) => (
  <motion.div initial={FADE_UP.initial} animate={FADE_UP.animate} transition={FADE_UP.transition} className={className}>
    <p className="section-eyebrow mb-3">{eyebrow}</p>
    <h1 className="text-4xl md:text-5xl font-display font-medium">{title}</h1>
  </motion.div>
);

export default PageHeader;
