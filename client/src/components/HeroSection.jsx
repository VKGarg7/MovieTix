import React, { useRef, useState } from "react";
import { ArrowRight, CalendarIcon, ClockIcon, StarIcon, PlayCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAppContext } from "../context/useAppContext";
import AnimatedTitle from "./cinematic/AnimatedTitle";
import FloatingPoster from "./cinematic/universe/FloatingPoster";
import MetaChip from "./cinematic/MetaChip";
import HeroWidgets from "./cinematic/HeroWidgets";
import RippleButton from "./cinematic/RippleButton";
import MagneticButton from "./cinematic/MagneticButton";
import TrailerModal from "./cinematic/TrailerModal";
import { dummyTrailers } from "../assets/assets";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { shows, image_base_url } = useAppContext();
  const featured = shows?.[0];
  const [trailerOpen, setTrailerOpen] = useState(false);

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  const title = featured ? (featured.isMysteryMovie ? "Mystery Screening" : featured.title) : "Guardians of the Galaxy";
  const genres = featured?.genres?.slice(0, 3).map((g) => g.name) || ["Action", "Adventure", "Sci-Fi"];
  const year = featured ? new Date(featured.release_date).getFullYear() : 2025;
  const runtimeMin = featured?.runtime;
  const runtimeLabel = runtimeMin ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m` : "2h 30m";
  const overview = featured?.overview || "In a post-apocalyptic world where cities ride on wheels and consume each other to survive, two people meet in London and try to stop a conspiracy.";
  const rating = featured?.vote_average;
  const posterSrc = featured ? image_base_url + (featured.poster_path || featured.backdrop_path) : "/backgroundImage.png";

  const goToMovie = () => {
    if (featured) {
      navigate(`/movies/${featured._id}`);
    } else {
      navigate("/movies");
    }
    scrollTo(0, 0);
  };

  return (
    <motion.div
      ref={sectionRef}
      style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
      className="relative min-h-screen overflow-hidden px-6 md:px-16 lg:px-20 xl:px-28 pt-32 pb-20 grid lg:grid-cols-[1fr_auto_auto] gap-10 lg:gap-8 items-center"
    >
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 70% 60% at 20% 45%, rgba(6,6,8,0.75) 0%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col items-start gap-5 max-w-xl">
        <motion.span
          variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="relative section-eyebrow px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
        >
          <motion.span
            className="absolute inset-0 bg-primary/20"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
          <span className="relative">Now Screening</span>
        </motion.span>

        <AnimatedTitle
          text={title}
          gradientLastWord
          className="text-5xl md:text-[64px] lg:text-[72px] md:leading-[0.98] font-display font-medium glow-text"
        />

        <div className="flex flex-wrap items-center gap-2">
          {genres.map((g, i) => (
            <MetaChip key={g} i={i}>{g}</MetaChip>
          ))}
          <MetaChip icon={CalendarIcon} i={genres.length}>{year}</MetaChip>
          <MetaChip icon={ClockIcon} i={genres.length + 1}>{runtimeLabel}</MetaChip>
          {rating != null && (
            <MetaChip icon={StarIcon} i={genres.length + 2} tone="amber">{rating.toFixed(1)}</MetaChip>
          )}
        </div>

        <motion.p
          variants={fadeUp} custom={3} initial="hidden" animate="show"
          className="text-gray-300/90 font-light leading-relaxed"
        >
          {overview}
        </motion.p>

        <motion.div
          variants={fadeUp} custom={4} initial="hidden" animate="show"
          className="flex flex-wrap items-center gap-3 mt-2"
        >
          <RippleButton
            onClick={goToMovie}
            className="flex items-center gap-2 px-7 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10"
          >
            {featured ? "Book Tickets" : "Explore Movies"}
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
              <ArrowRight className="w-4.5 h-4.5" />
            </motion.span>
          </RippleButton>

          <MagneticButton
            onClick={() => setTrailerOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/15 bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.08] transition-colors"
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <PlayCircleIcon className="w-4.5 h-4.5" />
            </motion.span>
            Watch Trailer
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 justify-self-center"
      >
        <FloatingPoster src={posterSrc} />
      </motion.div>

      <div className="relative z-10 justify-self-end">
        <HeroWidgets movie={featured} onWatchTrailer={() => setTrailerOpen(true)} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 z-10"
      >
        <span className="section-eyebrow">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent animate-float" />
      </motion.div>

      <TrailerModal open={trailerOpen} onClose={() => setTrailerOpen(false)} videoUrl={dummyTrailers[0].videoUrl} />
    </motion.div>
  );
};

export default HeroSection;
