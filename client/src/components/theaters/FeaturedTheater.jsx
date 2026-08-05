import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPinIcon, StarIcon, TicketIcon, Volume2Icon, MonitorPlayIcon, PopcornIcon, CarIcon, SofaIcon } from "lucide-react";
import TheaterArt from "../cinematic/TheaterArt";
import { getTheaterPresentation } from "../../lib/theaterPresentation";
import { deriveOpenStatus } from "../../lib/theaterOpenStatus";
import { useAppContext } from "../../context/useAppContext";

const AMENITY_ICONS = { dolby: Volume2Icon, imax: MonitorPlayIcon, foodCourt: PopcornIcon, parking: CarIcon, recliner: SofaIcon };

const FeaturedTheater = ({ theater }) => {
  const navigate = useNavigate();
  const { axios, setSelectedTheater } = useAppContext();
  const [openStatus, setOpenStatus] = useState(null);

  useEffect(() => {
    if (!theater) return;
    let cancelled = false;
    axios
      .get("/api/show/occupancy-pulse", { params: { theaterId: theater._id } })
      .then(({ data }) => {
        if (!cancelled && data.success) setOpenStatus(deriveOpenStatus(data.shows));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [theater, axios]);

  if (!theater) return null;

  const { palette, rating, distanceKm, amenities } = getTheaterPresentation(theater);

  const handleBookNow = () => {
    setSelectedTheater(theater);
    navigate("/movies");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[32px] overflow-hidden glass-panel mb-16"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative h-64 md:h-full min-h-72">
          <TheaterArt palette={palette} name={theater.name} className="absolute inset-0" />
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-primary/90 backdrop-blur-md">
            FEATURED
          </div>
          {openStatus && (
            <div
              className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${
                openStatus.isOpen
                  ? "bg-nebula-cyan/15 border-nebula-cyan/40 text-nebula-cyan"
                  : "bg-black/50 border-white/10 text-gray-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? "bg-nebula-cyan animate-pulse" : "bg-gray-500"}`} />
              {openStatus.isOpen ? "Open Now" : "Closed"}
            </div>
          )}
        </div>

        <div className="p-7 md:p-9 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/10">
              <StarIcon className="w-3.5 h-3.5 text-nebula-amber fill-nebula-amber" />
              {rating}
            </div>
            <span className="text-xs text-gray-500">{distanceKm} km away</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-medium mb-2">{theater.name}</h2>
          <p className="flex items-start gap-2 text-sm text-gray-400 mb-6">
            <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
            {theater.address}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {amenities.map((a) => {
              const Icon = AMENITY_ICONS[a.key];
              return (
                <span
                  key={a.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/[0.05] border border-white/10 text-gray-300"
                >
                  <Icon className="w-3.5 h-3.5 text-nebula-cyan" />
                  {a.label}
                </span>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBookNow}
            className="btn-glow self-start flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-medium cursor-pointer border border-white/10"
          >
            <TicketIcon className="w-4 h-4" /> Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedTheater;
