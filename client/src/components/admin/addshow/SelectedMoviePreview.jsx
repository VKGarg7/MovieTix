import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon, ClockIcon, CalendarIcon, GlobeIcon, FilmIcon } from "lucide-react";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const SelectedMoviePreview = ({ movie, imageBaseUrl }) => {
  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6 border border-dashed border-white/10 rounded-2xl">
        <FilmIcon className="w-8 h-8 text-gray-600 mb-2" />
        <p className="text-sm text-gray-500">Select a movie to preview it here.</p>
      </div>
    );
  }

  let language = null;
  if (movie.original_language) {
    try {
      language = languageNames.of(movie.original_language) ?? movie.original_language;
    } catch {
      language = movie.original_language;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={movie.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[2/3] max-w-48 mx-auto">
          <img src={imageBaseUrl + movie.poster_path} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        <h3 className="font-display text-xl font-medium text-center mb-3">{movie.title}</h3>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
            <StarIcon className="w-3 h-3 text-nebula-amber fill-nebula-amber" /> {movie.vote_average?.toFixed(1)}
          </span>
          {movie.runtime && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
              <ClockIcon className="w-3 h-3" /> {movie.runtime}m
            </span>
          )}
          {movie.release_date && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
              <CalendarIcon className="w-3 h-3" /> {movie.release_date}
            </span>
          )}
          {language && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
              <GlobeIcon className="w-3 h-3" /> {language}
            </span>
          )}
        </div>

        {movie.overview && (
          <p className="text-xs text-gray-400 leading-relaxed text-center line-clamp-4">{movie.overview}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SelectedMoviePreview;
