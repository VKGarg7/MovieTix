import React, { useRef, useState, useEffect, Children } from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const MovieCarousel = ({ children }) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [children]);

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width || 280;
    el.scrollBy({ left: dir * (cardWidth + 32), behavior: "smooth" });
  };

  const count = Children.count(children);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollPaddingLeft: 1 }}
      >
        {Children.map(children, (child) => (
          <div className="snap-start shrink-0">{child}</div>
        ))}
      </div>

      {count > 1 && (
        <>
          <motion.button
            initial={false}
            animate={{ opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? "auto" : "none" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollByCard(-1)}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/60 backdrop-blur-xl border border-white/15 hover:border-white/30 cursor-pointer shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            initial={false}
            animate={{ opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? "auto" : "none" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollByCard(1)}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/60 backdrop-blur-xl border border-white/15 hover:border-white/30 cursor-pointer shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </motion.button>
        </>
      )}
    </div>
  );
};

export default MovieCarousel;
