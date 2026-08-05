import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2Icon, HeartIcon } from "lucide-react";
import toast from "react-hot-toast";
import MovieCard from "../MovieCard";
import { useAppContext } from "../../context/useAppContext";

const DISSOLVE_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  angle: (i / 10) * 360,
  distance: 40 + (i % 3) * 20,
  delay: i * 0.02,
}));

const FavouriteCard = ({ movie, index = 0, onRemove }) => {
  const { axios, getToken, fetchFavoriteMovies } = useAppContext();
  const [removing, setRemoving] = useState(false);
  const [dissolved, setDissolved] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/movies/${movie._id}`;
    const shareData = { title: movie.title, text: `Check out ${movie.title} on MovieTix`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // user cancelled the native share sheet — not an error
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      const { data } = await axios.post(
        "api/user/update-favorite",
        { movieId: movie._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setDissolved(true);
        await fetchFavoriteMovies();
        setTimeout(() => onRemove?.(movie._id), 500);
      } else {
        setRemoving(false);
      }
    } catch {
      toast.error("Failed to remove favorite");
      setRemoving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: dissolved ? 0 : 1, y: 0, scale: dissolved ? 0.85 : 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: dissolved ? 0 : index * 0.04 }}
      className="relative"
    >
      <div className="relative">
        <MovieCard movie={movie} />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          title="Share"
          className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-black/80 backdrop-blur-xl border border-white/15 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <Share2Icon className="w-3.5 h-3.5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          disabled={removing}
          title="Remove from collection"
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-black/80 backdrop-blur-xl border border-primary/30 shadow-[0_8px_20px_-6px_rgba(248,69,101,0.6)] cursor-pointer disabled:opacity-50"
        >
          <motion.span animate={removing ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.4, repeat: removing ? Infinity : 0 }}>
            <HeartIcon className="w-3.5 h-3.5 fill-primary text-primary" />
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence>
        {dissolved && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {DISSOLVE_PARTICLES.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  scale: 0,
                }}
                transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                style={{ boxShadow: "0 0 8px 1px rgba(248,69,101,0.8)" }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FavouriteCard;
