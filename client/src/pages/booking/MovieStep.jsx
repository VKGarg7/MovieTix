import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StarIcon, ArrowRightIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import timeFormat from "../../lib/timeFormat";

const MovieStep = () => {
  const { shows, image_base_url } = useAppContext();
  const { state, patch, next } = useBookingFlow();
  const [showAll, setShowAll] = useState(!state.movie);

  useEffect(() => {
    if (!state.movie && shows.length > 0) {
      patch({ movie: shows[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shows]);

  const pickMovie = (movie) => {
    patch({ movie, show: null, theater: null, date: null, time: null, selectedSeats: [] });
    setShowAll(false);
  };

  return (
    <div>
      <p className="section-eyebrow mb-2">Step One</p>
      <h1 className="text-3xl md:text-4xl font-display font-medium mb-8">Choose Your Movie</h1>

      {state.movie && !showAll && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center max-w-xl"
        >
          <img
            src={image_base_url + (state.movie.poster_path || state.movie.backdrop_path)}
            alt=""
            className="w-24 h-36 object-cover rounded-xl border border-white/10 shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-xl font-display font-medium">{state.movie.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {state.movie.genres?.slice(0, 3).map((g) => g.name).join(" / ")} · {timeFormat(state.movie.runtime)}
            </p>
            {state.movie.vote_average != null && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-300">
                <StarIcon className="w-4 h-4 text-nebula-amber fill-nebula-amber" />
                {state.movie.vote_average.toFixed(1)}
              </div>
            )}
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-primary hover:underline mt-3 cursor-pointer"
            >
              Choose a different movie
            </button>
          </div>
        </motion.div>
      )}

      {showAll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-5 max-h-[50vh] overflow-y-auto no-scrollbar pb-2"
        >
          {shows.map((movie) => (
            <button
              key={movie._id}
              onClick={() => pickMovie(movie)}
              className={`relative w-32 rounded-2xl overflow-hidden border transition-colors cursor-pointer ${
                state.movie?._id === movie._id ? "border-primary" : "border-white/10 hover:border-white/25"
              }`}
            >
              <img src={image_base_url + (movie.poster_path || movie.backdrop_path)} alt="" loading="lazy" decoding="async" className="w-full h-44 object-cover" />
              <p className="text-xs p-2 truncate">{movie.title}</p>
            </button>
          ))}
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
