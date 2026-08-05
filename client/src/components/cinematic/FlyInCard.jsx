import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const FlyInCard = ({ children, index = 0, className = "" }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 55%"],
  });

  const fromX = index % 2 === 0 ? -80 : 80;
  const x = useTransform(scrollYProgress, [0, 1], [fromX, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -6 : 6, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.div ref={ref} style={{ x, y, scale, opacity, rotate, filter }} className={className}>
      {children}
    </motion.div>
  );
};

export default FlyInCard;
