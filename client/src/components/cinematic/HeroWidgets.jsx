import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StarIcon, PlayIcon, HeartIcon, MessageCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/useAppContext";

const widgetIn = (i) => ({
  initial: { opacity: 0, x: 30, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  transition: { delay: 0.7 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
});

const HeroWidgets = ({ movie, onWatchTrailer }) => {
  const { axios, user, getToken, favoriteMovies, fetchFavoriteMovies } = useAppContext();
  const [reviewCount, setReviewCount] = useState(null);
  const [favLoading, setFavLoading] = useState(false);

  const isFavorite = movie ? favoriteMovies.some((m) => m._id === movie._id) : false;

  useEffect(() => {
    if (!movie?._id) return;
    let cancelled = false;
    axios
      .get(`/api/review/${movie._id}`)
      .then(({ data }) => {
        if (!cancelled && data.success) setReviewCount(data.reviewCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [movie?._id, axios]);

  const toggleFavorite = async () => {
    if (!user) return toast.error("Please login to add to favorites");
    if (!movie) return;
    try {
      setFavLoading(true);
      const { data } = await axios.post(
        "api/user/update-favorite",
        { movieId: movie._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setFavLoading(false);
    }
  };

  if (!movie) return null;

  return (
    <div className="hidden lg:flex flex-col gap-3 w-52">
      <motion.div {...widgetIn(0)} className="glass-panel glass-panel-hover p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-nebula-amber/15 flex items-center justify-center shrink-0">
          <StarIcon className="w-4.5 h-4.5 text-nebula-amber fill-nebula-amber" />
        </div>
        <div>
          <p className="text-lg font-semibold leading-none">{movie.vote_average.toFixed(1)}</p>
          <p className="text-[11px] text-gray-400 mt-1">TMDB Rating</p>
        </div>
      </motion.div>

      {reviewCount !== null && (
        <motion.div {...widgetIn(1)} className="glass-panel glass-panel-hover p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-nebula-violet/15 flex items-center justify-center shrink-0">
            <MessageCircleIcon className="w-4.5 h-4.5 text-nebula-violet" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-none">{reviewCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">{reviewCount === 1 ? "Review" : "Reviews"}</p>
          </div>
        </motion.div>
      )}

      <motion.button
        {...widgetIn(2)}
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onWatchTrailer}
        className="glass-panel glass-panel-hover p-4 flex items-center gap-3 text-left cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <PlayIcon className="w-4 h-4 text-primary fill-primary ml-0.5" />
        </div>
        <div>
          <p className="text-sm font-medium leading-none">Watch Trailer</p>
          <p className="text-[11px] text-gray-400 mt-1">2 min preview</p>
        </div>
      </motion.button>

      <motion.button
        {...widgetIn(3)}
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={toggleFavorite}
        disabled={favLoading}
        className="glass-panel glass-panel-hover p-4 flex items-center gap-3 text-left cursor-pointer disabled:opacity-60"
      >
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <HeartIcon className={`w-4.5 h-4.5 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-white"}`} />
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{isFavorite ? "In Watchlist" : "Add to Watchlist"}</p>
          <p className="text-[11px] text-gray-400 mt-1">{isFavorite ? "Saved" : "Save for later"}</p>
        </div>
      </motion.button>
    </div>
  );
};

export default HeroWidgets;
