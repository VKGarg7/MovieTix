import { TicketIcon, Heart, PlayIcon, GlobeIcon, SparklesIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMotionValue, motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/useAppContext";
import CircularRating from "./cinematic/CircularRating";
import TrailerModal from "./cinematic/TrailerModal";
import { dummyTrailers } from "../assets/assets";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const SPARKLE_POSITIONS = [
  { top: "12%", left: "18%", delay: 0 },
  { top: "22%", left: "78%", delay: 0.15 },
  { top: "68%", left: "12%", delay: 0.3 },
  { top: "78%", left: "70%", delay: 0.45 },
];

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url, axios, getToken, user, fetchFavoriteMovies, favoriteMovies } = useAppContext();
  const [favLoading, setFavLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const isMystery = movie.isMysteryMovie;
  const isFavorite = favoriteMovies.some((m) => m._id === movie._id);
  const isNowPlaying = !isMystery && movie.release_date && new Date(movie.release_date) <= new Date();

  let language = null;
  if (!isMystery && movie.original_language) {
    try {
      language = languageNames.of(movie.original_language) ?? movie.original_language;
    } catch {
      language = movie.original_language;
    }
  }

  const cardRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springConfig = { stiffness: 200, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), springConfig);
  const moveX = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), springConfig);
  const moveY = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), springConfig);
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);
  const posterScale = useSpring(useTransform(my, [-0.5, 0.5], [1.14, 1.08]), springConfig);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
    setHovered(false);
  };

  const goToDetails = () => {
    navigate(`/movies/${movie._id}`);
    scrollTo(0, 0);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
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
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, x: moveX, y: moveY, transformPerspective: 1400, transformStyle: "preserve-3d" }}
      whileHover={{ y: -18, scale: 1.045 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative w-66 rounded-[28px] cursor-pointer group"
    >
      <div
        className="absolute -inset-px rounded-[28px] opacity-40 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "conic-gradient(from 180deg, #F84565, #FFB86B, #6D5CFF, #3FD8E0, #F84565)",
          filter: "blur(1px)",
        }}
      />
      <motion.div
        className="absolute -inset-8 rounded-[40px] blur-3xl pointer-events-none -z-10"
        animate={{ opacity: hovered ? 0.85 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(248,69,101,0.6), transparent 60%)`,
        }}
      />

      <motion.div
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 14, pointerEvents: hovered ? "auto" : "none" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: "translateZ(70px)" }}
        className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
      >
        <motion.button
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            setTrailerOpen(true);
          }}
          disabled={isMystery}
          title="Watch Trailer"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <PlayIcon className="w-3.5 h-3.5 fill-white text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            goToDetails();
          }}
          title="Book Tickets"
          className="h-10 px-4 rounded-full flex items-center gap-1.5 bg-primary text-white text-xs font-medium shadow-[0_10px_30px_-6px_rgba(248,69,101,0.7)] cursor-pointer"
        >
          <TicketIcon className="w-3.5 h-3.5" /> Book
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.88 }}
          onClick={handleFavorite}
          disabled={favLoading}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-white"}`} />
        </motion.button>
      </motion.div>

      <motion.div
        className="relative rounded-[28px] p-3 h-full overflow-hidden"
        animate={{
          boxShadow: hovered
            ? "0 1px 0 0 rgba(255,255,255,0.16) inset, 0 8px 16px -4px rgba(0,0,0,0.5), 0 60px 120px -24px rgba(0,0,0,0.9), 0 0 60px -16px rgba(248,69,101,0.45)"
            : "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 4px 10px -4px rgba(0,0,0,0.4), 0 25px 55px -25px rgba(0,0,0,0.7)",
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
          backdropFilter: "blur(24px) saturate(140%)",
        }}
      >
        <div className="noise-overlay rounded-[28px]" />
        <div className="relative rounded-2xl h-52 w-full overflow-hidden" style={{ transform: "translateZ(30px)" }} onClick={goToDetails}>
          {isMystery ? (
            <div className="relative h-full w-full bg-gradient-to-br from-nebula-violet/30 via-primary/20 to-void flex flex-col items-center justify-center gap-2.5 overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-50"
                animate={{ background: hovered
                  ? "radial-gradient(circle at 50% 40%, rgba(109,92,255,0.5), transparent 70%)"
                  : "radial-gradient(circle at 50% 40%, rgba(109,92,255,0.3), transparent 70%)" }}
                transition={{ duration: 0.6 }}
              />
              <motion.div
                animate={{ rotate: hovered ? 360 : 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-nebula-violet/40 backdrop-blur-md"
              >
                <SparklesIcon className="w-5 h-5 text-nebula-violet" />
              </motion.div>
              <p className="text-sm font-medium relative z-10">AI Unlock</p>
              <p className="text-[11px] text-gray-300/80 relative z-10 px-4 text-center leading-relaxed">
                {movie.genres?.slice(0, 2).map((g) => g.name).join(" / ")} · {timeFormat(movie.runtime)} · {movie.ratingBand}
              </p>
            </div>
          ) : (
            <motion.img
              src={image_base_url + movie.backdrop_path}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ scale: posterScale }}
              className="h-full w-full object-cover object-right-bottom"
            />
          )}

          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, backgroundPosition: hovered ? "120% 0%" : "-20% 0%" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 45%, transparent 60%)",
              backgroundSize: "220% 100%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <AnimatePresence>
            {hovered &&
              SPARKLE_POSITIONS.map((s, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, delay: s.delay, repeat: Infinity, repeatDelay: 0.6 }}
                  className="absolute w-1 h-1 rounded-full bg-white pointer-events-none"
                  style={{ top: s.top, left: s.left, boxShadow: "0 0 6px 1px rgba(255,255,255,0.8)" }}
                />
              ))}
          </AnimatePresence>

          {isNowPlaying && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-primary/90 backdrop-blur-md">
              NOW PLAYING
            </div>
          )}

          {!isMystery && (
            <div className="absolute top-2.5 right-11">
              <motion.div animate={hovered ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.6 }}>
                <CircularRating value={movie.vote_average} size={40} />
              </motion.div>
            </div>
          )}

          {isFavorite && (
            <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center pointer-events-none">
              <Heart className="w-4 h-4 fill-primary text-primary" />
            </div>
          )}

          {!isMystery && (
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-90 group-hover:opacity-100 transition-all duration-400">
              <p className="font-medium truncate font-display text-xl leading-tight">{movie.title}</p>
              <p className="text-xs text-gray-300 mt-1 tracking-wide truncate flex items-center gap-1.5 flex-wrap">
                <span>{new Date(movie.release_date).getFullYear()}</span>
                <span>·</span>
                <span>{movie.genres.slice(0, 2).map((genre) => genre.name).join(" / ")}</span>
                <span>·</span>
                <span>{timeFormat(movie.runtime)}</span>
                {language && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><GlobeIcon className="w-3 h-3" />{language}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {!isMystery && (
        <TrailerModal open={trailerOpen} onClose={() => setTrailerOpen(false)} videoUrl={dummyTrailers[0].videoUrl} />
      )}
    </motion.div>
  );
};

export default MovieCard;
