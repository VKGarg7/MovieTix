import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon, ArrowRightIcon, SearchIcon, CheckIcon, ClockIcon, GlobeIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import StepHeader from "../../components/cinematic/StepHeader";
import timeFormat from "../../lib/timeFormat";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const FALLBACK_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%230B0B10'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='18' fill='%23555' text-anchor='middle' dy='.3em'%3ENo Poster%3C/text%3E%3C/svg%3E";

const RATING_FILTERS = [
  { key: "all", label: "Any Rating" },
  { key: "7", label: "7+" },
  { key: "8", label: "8+" },
];

const AVAILABILITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "now", label: "Now Playing" },
  { key: "soon", label: "Coming Soon" },
];

const PosterImage = ({ src, alt }) => {
  const [errored, setErrored] = useState(false);
  return (
    <img
      src={errored || !src ? FALLBACK_POSTER : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="w-full h-full object-cover"
    />
  );
};

const MovieStep = () => {
  const { shows, image_base_url } = useAppContext();
  const { state, patch, next } = useBookingFlow();

  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const genres = useMemo(() => {
    const set = new Set();
    shows.forEach((m) => m.genres?.forEach((g) => set.add(g.name)));
    return ["all", ...Array.from(set).sort()];
  }, [shows]);

  const languages = useMemo(() => {
    const set = new Set();
    shows.forEach((m) => m.original_language && set.add(m.original_language));
    return ["all", ...Array.from(set).sort()];
  }, [shows]);

  const filteredShows = useMemo(() => {
    const now = new Date();
    return shows.filter((movie) => {
      if (query && !movie.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (genreFilter !== "all" && !movie.genres?.some((g) => g.name === genreFilter)) return false;
      if (languageFilter !== "all" && movie.original_language !== languageFilter) return false;
      if (ratingFilter !== "all" && (movie.vote_average || 0) < Number(ratingFilter)) return false;
      if (availabilityFilter !== "all") {
        const isNowPlaying = movie.release_date && new Date(movie.release_date) <= now;
        if (availabilityFilter === "now" && !isNowPlaying) return false;
        if (availabilityFilter === "soon" && isNowPlaying) return false;
      }
      return true;
    });
  }, [shows, query, genreFilter, languageFilter, ratingFilter, availabilityFilter]);

  const pickMovie = (movie) => {
    patch({ movie, show: null, theater: null, date: null, time: null, selectedSeats: [] });
  };

  return (
    <div>
      <StepHeader step={1} title="Choose Your Movie" />

      {/* search */}
      <div className="relative max-w-md mb-5">
        <SearchIcon className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="w-full glass-input pl-11"
        />
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {genres.length > 1 && (
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="glass-input text-xs py-2 px-3 cursor-pointer"
          >
            {genres.map((g) => (
              <option key={g} value={g} className="bg-void">
                {g === "all" ? "All Genres" : g}
              </option>
            ))}
          </select>
        )}
        {languages.length > 1 && (
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="glass-input text-xs py-2 px-3 cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l} value={l} className="bg-void">
                {l === "all" ? "All Languages" : languageNames.of(l) ?? l}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-1.5">
          {RATING_FILTERS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRatingFilter(r.key)}
              className={`px-3 py-2 rounded-full text-xs border transition-colors cursor-pointer ${
                ratingFilter === r.key ? "bg-primary border-primary text-white" : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/25"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {AVAILABILITY_FILTERS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAvailabilityFilter(a.key)}
              className={`px-3 py-2 rounded-full text-xs border transition-colors cursor-pointer ${
                availabilityFilter === a.key ? "bg-primary border-primary text-white" : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/25"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {filteredShows.length === 0 ? (
        <p className="text-gray-400 text-sm font-light">No movies match your filters.</p>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredShows.map((movie, i) => {
              const isSelected = state.movie?._id === movie._id;
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
                  layout
                  key={movie._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
                  whileHover={{ y: -6 }}
                  onClick={() => pickMovie(movie)}
                  className={`relative text-left rounded-[22px] overflow-hidden border transition-all duration-300 cursor-pointer group ${
                    isSelected ? "border-primary" : "border-white/10 hover:border-white/25"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 0 1px rgba(248,69,101,0.5), 0 0 30px -6px rgba(248,69,101,0.7)" }
                      : undefined
                  }
                >
                  <div className="relative h-56 w-full overflow-hidden bg-white/[0.02]">
                    <motion.div className="w-full h-full" whileHover={{ scale: 1.08 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                      <PosterImage src={movie.poster_path ? image_base_url + movie.poster_path : null} alt={movie.title} />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                    {movie.vote_average != null && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md border border-white/10">
                        <StarIcon className="w-3 h-3 text-nebula-amber fill-nebula-amber" />
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_16px_-2px_rgba(248,69,101,0.9)]"
                        >
                          <CheckIcon className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="p-3 bg-white/[0.03] backdrop-blur-xl">
                    <p className="font-medium text-sm truncate font-display">{movie.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      {movie.genres?.slice(0, 2).map((g) => g.name).join(" • ")}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{timeFormat(movie.runtime)}</span>
                      {language && <span className="flex items-center gap-1"><GlobeIcon className="w-3 h-3" />{language}</span>}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        disabled={!state.movie}
        onClick={next}
        className="btn-glow mt-10 flex items-center gap-2 px-9 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10 disabled:opacity-40 disabled:pointer-events-none"
      >
        Continue to Theater
        <ArrowRightIcon className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default MovieStep;
