import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { MapPinIcon, StarIcon, NavigationIcon } from "lucide-react";
import OccupancyBar from "../components/OccupancyBar";
import Loading from "../components/Loading";
import TheaterArt from "../components/cinematic/TheaterArt";
import { getTheaterPresentation, AMENITIES } from "../lib/theaterPresentation";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";
import { Volume2Icon, MonitorPlayIcon, PopcornIcon, CarIcon, SofaIcon } from "lucide-react";

const POLL_INTERVAL_MS = 60000;

const AMENITY_ICONS = {
  dolby: Volume2Icon,
  imax: MonitorPlayIcon,
  foodCourt: PopcornIcon,
  parking: CarIcon,
  recliner: SofaIcon,
};

const TheaterDetails = () => {
  const { id } = useParams();
  const { axios, fetchTheaters } = useAppContext();

  const [theater, setTheater] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTheater = async () => {
      const theaters = await fetchTheaters();
      if (!cancelled) setTheater(theaters.find((t) => t._id === id) || null);
    };
    loadTheater();
    return () => { cancelled = true; };
  }, [id, fetchTheaters]);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get("/api/show/occupancy-pulse", { params: { theaterId: id } });
      if (!isCancelled() && data.success) setShows(data.shows);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { deps: [id, axios] });

  if (loading) return <Loading />;

  const { palette, rating, distanceKm, amenities } = theater ? getTheaterPresentation(theater) : { palette: ["#6D5CFF", "#F84565"], amenities: [] };

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-36 pb-32 md:pt-52">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[32px] overflow-hidden glass-panel h-64 md:h-80 mb-10"
      >
        <TheaterArt palette={palette} name={theater?.name} className="absolute inset-0" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <p className="section-eyebrow mb-2">Theater</p>
          <h1 className="text-3xl md:text-4xl font-display font-medium">{theater?.name || "Theater"}</h1>
          <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-gray-300">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4" /> {theater?.address}
            </div>
            {theater && (
              <>
                <div className="flex items-center gap-1.5">
                  <StarIcon className="w-4 h-4 text-nebula-amber fill-nebula-amber" /> {rating}
                </div>
                <div className="flex items-center gap-1.5">
                  <NavigationIcon className="w-4 h-4 text-primary" /> {distanceKm} km away
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {theater && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap gap-3 mb-14"
        >
          {amenities.map((a) => {
            const Icon = AMENITY_ICONS[a.key];
            return (
              <span
                key={a.key}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white/[0.05] border border-white/10 text-gray-300"
              >
                <Icon className="w-4 h-4 text-nebula-cyan" />
                {a.label}
              </span>
            );
          })}
        </motion.div>
      )}

      <p className="section-eyebrow mb-2">Right Now</p>
      <p className="text-2xl font-display font-medium mb-8">Live Occupancy — Next 24 Hours</p>

      {shows.length === 0 ? (
        <p className="text-gray-400 text-sm font-light">No upcoming shows in the next 24 hours.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shows.map((show, i) => (
            <motion.div
              key={show._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
              className="glass-panel glass-panel-hover p-5 flex flex-col gap-3"
            >
              <p className="font-medium truncate font-display text-lg">{show.title}</p>
              <p className="text-xs text-gray-400">
                {show.screenName} · {new Date(show.showDateTime).toLocaleString()}
              </p>
              <OccupancyBar occupancyPct={show.occupancyPct} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TheaterDetails;
