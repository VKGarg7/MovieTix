import React from "react";
import { motion } from "framer-motion";
import MovieCard from "../MovieCard";
import AIMatchRing from "./AIMatchRing";

const RecommendationCard = ({ movie, reason, matchPercent, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col gap-3"
  >
    <div className="relative">
      <MovieCard movie={movie} />
      {matchPercent != null && (
        <div className="absolute -top-3 -left-3 z-10">
          <AIMatchRing percent={matchPercent} size={48} />
        </div>
      )}
    </div>
    <p className="text-xs text-gray-400 max-w-66 pl-1 font-light leading-relaxed">{reason}</p>
  </motion.div>
);

export default RecommendationCard;
