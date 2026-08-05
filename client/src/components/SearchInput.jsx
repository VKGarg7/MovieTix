import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, XIcon, SparklesIcon } from "lucide-react";
import VoiceButton from "./cinematic/VoiceButton";

const ROTATING_SUGGESTIONS = [
  "Search movies...",
  "Try \"action\" or \"comedy\"...",
  "Search by title...",
  "Find your next watch...",
];

const SearchInput = ({ value, onChange, onClear, placeholder, suggestions: suggestionsProp, className = "" }) => {
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef(null);

  const suggestions = suggestionsProp || (placeholder ? [placeholder] : ROTATING_SUGGESTIONS);

  useEffect(() => {
    if (value || focused || suggestions.length < 2) return;
    const t = setInterval(() => setPlaceholderIndex((i) => (i + 1) % suggestions.length), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, width: focused ? "100%" : "min(100%, 28rem)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative max-w-xl ${className}`}
    >
      <motion.div
        className="absolute -inset-[1.5px] rounded-full pointer-events-none"
        animate={{ opacity: focused ? 1 : 0.45 }}
        transition={{ duration: 0.3 }}
        style={{ background: "conic-gradient(from 0deg, #F84565, #FFB86B, #6D5CFF, #3FD8E0, #F84565)" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{ background: "conic-gradient(from 0deg, #F84565, #FFB86B, #6D5CFF, #3FD8E0, #F84565)" }}
        />
      </motion.div>

      <motion.div
        className="absolute -inset-4 rounded-full blur-2xl pointer-events-none -z-10"
        animate={{ opacity: focused ? 0.5 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: "radial-gradient(circle, rgba(109,92,255,0.5), transparent 70%)" }}
      />

      <div className="relative flex items-center gap-1.5 rounded-full bg-[#0c0c13] pl-4 pr-2 py-1 m-[1.5px]">
        <SparklesIcon className={`w-4 h-4 shrink-0 transition-colors ${focused ? "text-nebula-violet" : "text-gray-500"}`} />

        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent py-2 text-sm text-white outline-none relative z-10"
          />
          {!value && (
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-sm text-gray-500 whitespace-nowrap"
                >
                  {suggestions[placeholderIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClear}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <VoiceButton disabled={false} onResult={(text) => onChange(text)} />

        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 shrink-0">
          <SearchIcon className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
};

export default SearchInput;
