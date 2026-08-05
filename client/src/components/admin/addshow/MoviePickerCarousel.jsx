import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, StarIcon, GlobeIcon } from "lucide-react";
import { kConverter } from "../../../lib/kConverter";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const MoviePickerCarousel = ({ movies, selectedMovie, onSelect, imageBaseUrl }) => (
  <div className="overflow-x-auto pb-3 no-scrollbar">
    <div className="flex gap-4 w-max">
      {movies.map((movie, i) => {
        const isSelected = selectedMovie === movie.id;
        let language = null;
        if (movie.original_language) {
          try {
            language = languageNames.of(movie.original_language) ?? movie.original_language;
          } catch {
            language = movie.original_language;
          }
        }

        return (
          <motion.button
            key={movie.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: (i % 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={() => onSelect(movie.id)}
            className={`relative w-36 shrink-0 text-left rounded-2xl overflow-hidden border backdrop-blur-xl cursor-pointer transition-colors ${
              isSelected ? "border-primary/60 shadow-[0_0_40px_-10px_rgba(248,69,101,0.6)]" : "border-white/10 hover:border-white/25"
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden bg-white/5">
              <img
                src={imageBaseUrl + movie.poster_path}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />

              {isSelected && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </span>
              )}

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/90">
                  <StarIcon className="w-3 h-3 text-primary fill-primary" />
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-gray-300">{kConverter(movie.vote_count)} votes</span>
              </div>
            </div>

            <div className="p-2.5">
              <p className="text-xs font-medium truncate">{movie.title}</p>
              <p className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 truncate">
                {movie.release_date}
                {language && (
                  <>
                    <span>·</span>
                    <GlobeIcon className="w-2.5 h-2.5 shrink-0" />
                    {language}
                  </>
                )}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default MoviePickerCarousel;
