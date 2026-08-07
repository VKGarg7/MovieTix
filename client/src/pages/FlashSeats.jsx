import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ZapIcon, ClockIcon, MapPinIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import PageHeader from "../components/cinematic/PageHeader";
import Loading from "../components/Loading";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";
import { dateFormat } from "../lib/dateFomat";

const POLL_INTERVAL_MS = 30000;

const minutesUntil = (dateTime) => Math.max(0, Math.round((new Date(dateTime).getTime() - Date.now()) / 60000));

const FlashSeats = () => {
  const navigate = useNavigate();
  const { axios, image_base_url, selectedTheater } = useAppContext();

  const [shows, setShows] = useState(null);
  const [loading, setLoading] = useState(true);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get("/api/show/flash-seats", {
        params: selectedTheater?._id ? { theaterId: selectedTheater._id } : undefined,
      });
      if (!isCancelled() && data.success) setShows(data.shows);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { deps: [selectedTheater, axios] });

  if (loading) return <Loading />;

  return (
    <div className="relative pt-36 pb-32 px-6 md:px-16 lg:px-40 xl:px-44 min-h-[80vh]">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <PageHeader eyebrow="Tonight's Deals" title="Flash Seats" />
      <p className="text-gray-400 text-sm -mt-5 mb-10 max-w-xl">
        Steep last-minute discounts on shows starting soon with plenty of empty seats. A show drops off
        this board the moment it fills up or starts — grab a deal while it lasts.
      </p>

      {!shows || shows.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16">
          <ZapIcon className="w-8 h-8 text-gray-600 mb-3" />
          <h2 className="text-xl font-display font-medium">No flash deals right now</h2>
          <p className="text-gray-400 mt-2 font-light">Check back closer to showtime — deals appear as seats stay empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shows.map((show, i) => {
            const seatsLeft = show.totalCapacity - show.occupiedCount;
            const discountPercent = Math.round((1 - show.computedPrice / show.showPrice) * 100);
            return (
              <motion.div
                key={show.showId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05 }}
                onClick={() => navigate(`/movies/${show.movie._id}`)}
                className="glass-panel glass-panel-hover p-4 cursor-pointer flex gap-3"
              >
                {show.movie.poster_path && (
                  <img
                    src={image_base_url + show.movie.poster_path}
                    alt=""
                    className="w-16 h-24 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-nebula-amber/90 text-void">
                      <ZapIcon className="w-2.5 h-2.5" /> -{discountPercent}%
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" /> in {minutesUntil(show.showDateTime)}m
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {show.isMysteryMovie ? "Mystery Movie" : show.movie.title}
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPinIcon className="w-3 h-3 shrink-0" /> {show.theater.name}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{dateFormat(show.showDateTime)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-nebula-cyan">₹{show.computedPrice}</span>
                    <span className="text-xs text-gray-500 line-through">₹{show.showPrice}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{seatsLeft} seats left</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlashSeats;
