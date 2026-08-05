import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { MapPinIcon, StarIcon, NavigationIcon, Volume2Icon, MonitorPlayIcon, PopcornIcon, CarIcon, SofaIcon, TicketIcon } from "lucide-react";
import TheaterArt from "./cinematic/TheaterArt";
import { getTheaterPresentation } from "../lib/theaterPresentation";
import { useAppContext } from "../context/useAppContext";

const AMENITY_ICONS = {
  dolby: Volume2Icon,
  imax: MonitorPlayIcon,
  foodCourt: PopcornIcon,
  parking: CarIcon,
  recliner: SofaIcon,
};

const TheaterCard = ({ theater }) => {
  const navigate = useNavigate();
  const { setSelectedTheater } = useAppContext();
  const { palette, rating, distanceKm, amenities } = getTheaterPresentation(theater);

  const cardRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springConfig = { stiffness: 180, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), springConfig);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const handleBookTickets = (e) => {
    e.stopPropagation();
    setSelectedTheater(theater);
    navigate("/movies");
  };

  const handleGetDirections = (e) => {
    e.stopPropagation();
    const { lat, lng } = theater.geolocation || {};
    const url = lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(theater.address)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/theaters/${theater._id}`)}
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
      whileHover={{ y: -18, scale: 1.035 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative w-full max-w-sm cursor-pointer group"
    >
      <div
        className="absolute -inset-px rounded-[28px] opacity-30 group-hover:opacity-90 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`, filter: "blur(1px)" }}
      />
      <div
        className="absolute -inset-6 rounded-[40px] opacity-0 group-hover:opacity-70 blur-3xl transition-opacity duration-500 -z-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${palette[0]}77, transparent 65%)` }}
      />

      <div className="relative rounded-[28px] overflow-hidden glass-panel p-0">
        <div className="relative h-48 w-full overflow-hidden" style={{ transform: "translateZ(20px)" }}>
          <motion.div className="absolute inset-0" animate={{ scale: 1 }} whileHover={{ scale: 1.08 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <TheaterArt palette={palette} name={theater.name} />
          </motion.div>
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/55 backdrop-blur-md border border-white/10 shadow-[0_0_16px_-2px_rgba(255,184,107,0.6)]">
            <StarIcon className="w-3.5 h-3.5 text-nebula-amber fill-nebula-amber" />
            {rating}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/55 backdrop-blur-md border border-white/10">
            <NavigationIcon className="w-3 h-3 text-primary" />
            {distanceKm} km
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-display font-medium truncate">{theater.name}</h2>
          <div className="flex items-start gap-2 text-sm text-gray-400 mt-2">
            <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{theater.address}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {amenities.map((a) => {
              const Icon = AMENITY_ICONS[a.key];
              return (
                <span
                  key={a.key}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] bg-white/[0.05] border border-white/10 text-gray-300"
                >
                  <Icon className="w-3.5 h-3.5 text-nebula-cyan" />
                  {a.label}
                </span>
              );
            })}
          </div>

          <div className="mt-4 h-0 group-hover:h-10 overflow-hidden transition-all duration-400 ease-out flex gap-2">
            <motion.button
              onClick={handleBookTickets}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs bg-white/10 hover:bg-primary rounded-full font-medium border border-white/10 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 delay-75 cursor-pointer"
            >
              <TicketIcon className="w-3.5 h-3.5" /> Book Tickets
            </motion.button>
            <motion.button
              onClick={handleGetDirections}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title="Get Directions"
              className="w-10 shrink-0 flex items-center justify-center bg-white/[0.06] hover:bg-white/15 rounded-full border border-white/10 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 delay-100 cursor-pointer"
            >
              <NavigationIcon className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TheaterCard;
