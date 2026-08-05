import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  StarIcon,
  ClockIcon,
  CalendarIcon,
  GlobeIcon,
  FilmIcon,
  AwardIcon,
  HeartIcon,
  Share2Icon,
  DownloadIcon,
  TicketIcon,
  PlayCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { dummyTrailers } from "../assets/assets";
import SectionHeader from "./cinematic/SectionHeader";
import RevealSection from "./cinematic/RevealSection";
import CinematicPlayer from "./cinematic/CinematicPlayer";
import RelatedTrailerCard from "./cinematic/RelatedTrailerCard";
import CinemaAmbience from "./cinematic/CinemaAmbience";
import MetaChip from "./cinematic/MetaChip";
import CircularRating from "./cinematic/CircularRating";
import RippleButton from "./cinematic/RippleButton";
import MagneticButton from "./cinematic/MagneticButton";

const DETAILS = {
  WpW36ldAqnM: {
    title: "Wednesday: Season 2",
    genre: "Mystery · Comedy",
    duration: "2:34",
    runtime: "8 Episodes",
    language: "English",
    releaseDate: "Aug 6, 2026",
    director: "Tim Burton",
    cast: "Jenna Ortega, Catherine Zeta-Jones",
    rating: 8.6,
    rt: 94,
    awards: "Primetime Emmy Nominee",
  },
  "-sAOWhvheK8": {
    title: "Havoc",
    genre: "Action · Thriller",
    duration: "2:12",
    runtime: "1h 47m",
    language: "English",
    releaseDate: "Apr 25, 2026",
    director: "Gareth Evans",
    cast: "Tom Hardy, Forest Whitaker",
    rating: 7.9,
    rt: 88,
    awards: "TIFF Official Selection",
  },
  "1pHDWnXmK7Y": {
    title: "The Electric State",
    genre: "Sci-Fi · Adventure",
    duration: "2:47",
    runtime: "2h 8m",
    language: "English",
    releaseDate: "Mar 14, 2026",
    director: "Anthony & Joe Russo",
    cast: "Millie Bobby Brown, Chris Pratt",
    rating: 7.2,
    rt: 81,
    awards: "Visual Effects Society Nominee",
  },
  umiKiW4En9g: {
    title: "Ballerina",
    genre: "Action · Crime",
    duration: "2:19",
    runtime: "2h 5m",
    language: "English",
    releaseDate: "Jun 6, 2026",
    director: "Len Wiseman",
    cast: "Ana de Armas, Keanu Reeves",
    rating: 8.1,
    rt: 90,
    awards: "Saturn Award Nominee",
  },
};

const getVideoId = (url) => url?.split("v=")[1]?.split("&")[0];

const TrailersSection = () => {
  const trailers = useMemo(
    () =>
      dummyTrailers.map((t) => ({
        ...t,
        ...(DETAILS[getVideoId(t.videoUrl)] || {}),
      })),
    []
  );

  const [currentTrailer, setCurrentTrailer] = useState(trailers[0]);
  const [wishlisted, setWishlisted] = useState(false);

  const handleShare = async () => {
    const shareData = { title: currentTrailer.title, text: `Watch the trailer for ${currentTrailer.title} on MovieTix`, url: currentTrailer.videoUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(currentTrailer.videoUrl);
        toast.success("Trailer link copied");
      }
    } catch {
      // user cancelled the native share sheet — not an error
    }
  };

  const handleWishlist = () => {
    setWishlisted((v) => !v);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleDownloadWallpaper = () => {
    const a = document.createElement("a");
    a.href = currentTrailer.image;
    a.download = `${currentTrailer.title || "movietix"}-wallpaper.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 pt-28 pb-32 overflow-hidden">
      <div className="relative">
        <CinemaAmbience />

        <SectionHeader
          eyebrow="Behind The Scenes"
          title="Watch The Official Trailer"
          subtitle="Step onto the screen — every trailer, framed like the premiere itself."
        />

        <RevealSection>
          <CinematicPlayer trailer={currentTrailer} poster={currentTrailer.image} />
        </RevealSection>

        <RevealSection delay={0.15} className="mt-10 md:mt-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <CircularRating value={currentTrailer.rating ?? 0} size={48} />
                <div className="leading-tight">
                  <p className="text-xs text-gray-400">IMDb Rating</p>
                  <p className="text-sm font-medium">{(currentTrailer.rating ?? 0).toFixed(1)} / 10</p>
                </div>
                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />
                <div className="leading-tight">
                  <p className="text-xs text-gray-400">Rotten Tomatoes</p>
                  <p className="text-sm font-medium text-nebula-amber">{currentTrailer.rt ?? "--"}%</p>
                </div>
              </div>

              <h3 className="font-display text-3xl md:text-4xl font-medium mb-3">{currentTrailer.title}</h3>

              <p className="text-gray-400 leading-relaxed max-w-2xl mb-5">
                An immersive cinematic experience crafted for the biggest screen in the house. Book your seats and catch
                every frame the way it was meant to be seen.
              </p>

              <div className="flex flex-wrap gap-2.5 mb-6">
                <MetaChip icon={ClockIcon} i={0}>{currentTrailer.runtime}</MetaChip>
                <MetaChip icon={FilmIcon} i={1}>{currentTrailer.genre}</MetaChip>
                <MetaChip icon={GlobeIcon} i={2}>{currentTrailer.language}</MetaChip>
                <MetaChip icon={CalendarIcon} i={3}>{currentTrailer.releaseDate}</MetaChip>
                <MetaChip icon={AwardIcon} i={4} tone="amber">{currentTrailer.awards}</MetaChip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-xl mb-8">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Director</p>
                  <p className="text-gray-200">{currentTrailer.director}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Cast</p>
                  <p className="text-gray-200">{currentTrailer.cast}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <RippleButton className="text-white px-8 py-3.5 border border-white/10 rounded-full text-sm inline-flex items-center gap-2">
                  <TicketIcon className="w-4 h-4" /> Book Tickets
                </RippleButton>

                <MagneticButton
                  as={motion.a}
                  href={currentTrailer.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-colors cursor-pointer"
                >
                  <PlayCircleIcon className="w-4 h-4" /> Watch Trailer
                </MagneticButton>

                <MagneticButton
                  onClick={handleWishlist}
                  whileTap={{ scale: 0.9 }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm border backdrop-blur-xl transition-colors cursor-pointer ${
                    wishlisted ? "border-primary/50 bg-primary/15 text-primary" : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  <HeartIcon className={`w-4 h-4 ${wishlisted ? "fill-primary" : ""}`} /> Wishlist
                </MagneticButton>

                <MagneticButton
                  onClick={handleShare}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-colors cursor-pointer"
                  aria-label="Share trailer"
                >
                  <Share2Icon className="w-4 h-4" />
                </MagneticButton>

                <MagneticButton
                  onClick={handleDownloadWallpaper}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-colors cursor-pointer"
                  aria-label="Download wallpaper"
                >
                  <DownloadIcon className="w-4 h-4" />
                </MagneticButton>
              </div>
            </div>

            <div className="w-full lg:w-64 shrink-0 glass-panel p-5 h-fit">
              <p className="section-eyebrow mb-4">At A Glance</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Runtime</span>
                  <span>{currentTrailer.runtime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Language</span>
                  <span>{currentTrailer.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Release</span>
                  <span>{currentTrailer.releaseDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-3.5 h-3.5 text-nebula-amber fill-nebula-amber" />
                    {(currentTrailer.rating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={0.1} className="mt-16 md:mt-20">
          <p className="section-eyebrow mb-5">Related Trailers</p>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
            {trailers.map((trailer, i) => (
              <RelatedTrailerCard
                key={trailer.videoUrl}
                trailer={trailer}
                i={i}
                active={currentTrailer.videoUrl === trailer.videoUrl}
                onSelect={setCurrentTrailer}
              />
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={0.15} className="mt-16 md:mt-20">
          <p className="section-eyebrow mb-5">Gallery</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trailers.map((trailer, i) => (
              <motion.div
                key={`gallery-${trailer.videoUrl}`}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10 hover:border-white/25 transition-colors cursor-pointer"
                onClick={() => setCurrentTrailer(trailer)}
              >
                <img
                  src={trailer.image}
                  alt={trailer.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-2.5 left-3 right-3 text-xs font-medium truncate">{trailer.title}</p>
              </motion.div>
            ))}
          </div>
        </RevealSection>
      </div>
    </div>
  );
};

export default TrailersSection;
