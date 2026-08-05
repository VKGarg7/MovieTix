import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlayCircleIcon, TicketIcon, HeartIcon, SparklesIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/useAppContext";
import TrailerModal from "./TrailerModal";
import AIMatchRing from "./AIMatchRing";
import { dummyTrailers } from "../../assets/assets";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const FeaturedRecommendation = ({ movie, reason, matchPercent }) => {
  const navigate = useNavigate();
  const { image_base_url, axios, getToken, user, fetchFavoriteMovies, favoriteMovies } = useAppContext();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const isFavorite = favoriteMovies.some((m) => m._id === movie._id);
  const cast = (movie.casts || []).slice(0, 5);

  const toggleFavorite = async () => {
    if (!user) return toast.error("Please login to add to favorites");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full rounded-[32px] overflow-hidden glass-panel glass-panel-hover min-h-[420px] md:min-h-[480px] col-span-full"
    >
      <img
        src={image_base_url + (movie.backdrop_path || movie.poster_path)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/50 via-transparent to-transparent" />

      <motion.div
        className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none"
        style={{ background: "linear-gradient(100deg, transparent 20%, rgba(109,92,255,0.45) 40%, transparent 60%)", backgroundSize: "250% 250%" }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <div className="noise-overlay" />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 h-full flex flex-col justify-center gap-5 p-8 md:p-14 max-w-2xl"
      >
        {matchPercent != null && (
          <motion.div variants={item} className="flex items-center gap-3">
            <AIMatchRing percent={matchPercent} size={52} />
            <div>
              <p className="text-sm font-semibold text-nebula-violet">Strong Match</p>
              <p className="text-xs text-gray-400">Based on your taste profile</p>
            </div>
          </motion.div>
        )}

        <motion.h3 variants={item} className="text-4xl md:text-5xl font-display font-medium leading-[1.05]">
          {movie.title}
        </motion.h3>

        <motion.p variants={item} className="text-sm text-gray-300 font-light leading-relaxed line-clamp-3 max-w-lg">
          {movie.overview}
        </motion.p>

        {reason && (
          <motion.div variants={item} className="flex items-start gap-2 px-3.5 py-2.5 rounded-2xl bg-nebula-violet/10 border border-nebula-violet/25 w-max max-w-full">
            <SparklesIcon className="w-4 h-4 text-nebula-violet mt-0.5 shrink-0" />
            <p className="text-xs text-nebula-violet/90 leading-relaxed">{reason}</p>
          </motion.div>
        )}

        {cast.length > 0 && (
          <motion.div variants={item} className="flex items-center gap-2">
            <div className="flex -space-x-3">
              {cast.map((c, i) => (
                <img
                  key={i}
                  src={image_base_url + c.profile_path}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 rounded-full object-cover border-2 border-void"
                  style={{ zIndex: cast.length - i }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">{cast.map((c) => c.name).join(", ")}</p>
          </motion.div>
        )}

        <motion.div variants={item} className="flex items-center gap-3 mt-1">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { navigate(`/movies/${movie._id}`); scrollTo(0, 0); }}
            className="btn-glow flex items-center gap-2 px-6 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/10"
          >
            <TicketIcon className="w-4 h-4" />
            Book Tickets
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTrailerOpen(true)}
            className="flex items-center gap-2 px-5 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/15 bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.1] transition-colors"
          >
            <PlayCircleIcon className="w-4 h-4" />
            Trailer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            disabled={favLoading}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-white/15 bg-white/[0.05] backdrop-blur-xl cursor-pointer"
            title={isFavorite ? "Remove from watchlist" : "Add to watchlist"}
          >
            <HeartIcon className={`w-4.5 h-4.5 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-white"}`} />
          </motion.button>
        </motion.div>
      </motion.div>

      <TrailerModal open={trailerOpen} onClose={() => setTrailerOpen(false)} videoUrl={dummyTrailers[0].videoUrl} />
    </motion.div>
  );
};

export default FeaturedRecommendation;
