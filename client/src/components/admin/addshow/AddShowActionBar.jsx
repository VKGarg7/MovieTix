import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2Icon, EyeIcon, XIcon, RocketIcon } from "lucide-react";

const AddShowActionBar = ({ onCancel, onPreview, onPublish, publishing, canPublish }) => {
  const [ripples, setRipples] = useState([]);

  const handlePublishClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onPublish();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={onCancel}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
      >
        <XIcon className="w-4 h-4" /> Cancel
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={onPreview}
        disabled={!canPublish}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <EyeIcon className="w-4 h-4" /> Preview
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: canPublish ? 1.03 : 1 }}
        whileTap={{ scale: canPublish ? 0.96 : 1 }}
        onClick={handlePublishClick}
        disabled={!canPublish || publishing}
        className="relative overflow-hidden flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-medium btn-glow border border-white/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
      >
        {publishing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <RocketIcon className="w-4 h-4" />}
        {publishing ? "Publishing…" : "Publish Show"}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0.5, scale: 0 }}
              animate={{ opacity: 0, scale: 5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none bg-white"
              style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
            />
          ))}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default AddShowActionBar;
