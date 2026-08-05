import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, Loader2Icon } from "lucide-react";

const LoadMoreButton = ({ onClick, remaining, loading }) => (
  <motion.button
    onClick={onClick}
    disabled={loading}
    whileHover={{ scale: 1.04, y: -2 }}
    whileTap={{ scale: 0.97 }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="btn-glow relative flex items-center gap-2 px-9 py-3.5 rounded-full text-sm font-medium cursor-pointer border border-white/10 disabled:cursor-wait"
  >
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          Loading…
        </motion.span>
      ) : (
        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          Load More Movies
          <span className="text-gray-400 font-normal">({remaining} more)</span>
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

export default LoadMoreButton;
