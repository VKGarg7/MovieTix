import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPinIcon, StarIcon, NavigationIcon, CheckIcon, Volume2Icon, MonitorPlayIcon, PopcornIcon, CarIcon, SofaIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import { getTheaterPresentation } from "../../lib/theaterPresentation";
import TheaterArt from "../../components/cinematic/TheaterArt";
import Loading from "../../components/Loading";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";

const AMENITY_ICONS = {
  dolby: Volume2Icon,
  imax: MonitorPlayIcon,
  foodCourt: PopcornIcon,
  parking: CarIcon,
  recliner: SofaIcon,
};

const TheaterStep = () => {
  const { fetchTheaters, selectedCity, setSelectedTheater } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await fetchTheaters(selectedCity);
      if (!cancelled) {
        setTheaters(result);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedCity, fetchTheaters]);

  const pickTheater = (theater) => {
    patch({ theater, show: null, date: null, time: null, selectedSeats: [] });
    setSelectedTheater(theater);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <StepHeader step={2} title={selectedCity ? `Theaters in ${selectedCity}` : "Choose Your Theater"} />

      {theaters.length === 0 ? (
        <p className="text-gray-400 font-light">No theaters available{selectedCity ? ` in ${selectedCity}` : ""} — try changing your city from the navbar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {theaters.map((theater, i) => {
            const { palette, rating, distanceKm, amenities } = getTheaterPresentation(theater);
            const isSelected = state.theater?._id === theater._id;
            return (
              <motion.button
                key={theater._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                whileHover={{ y: -6 }}
                onClick={() => pickTheater(theater)}
                className={`relative text-left rounded-[24px] overflow-hidden border transition-colors duration-300 cursor-pointer ${
                  isSelected ? "border-primary" : "border-white/10 hover:border-white/25"
                }`}
                style={isSelected ? { boxShadow: "0 0 0 1px rgba(248,69,101,0.5), 0 0 34px -8px rgba(248,69,101,0.75)" } : undefined}
              >
                <div className="relative h-32 w-full">
                  <TheaterArt palette={palette} name={theater.name} />
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/55 backdrop-blur-md border border-white/10">
                    <StarIcon className="w-3.5 h-3.5 text-nebula-amber fill-nebula-amber" />
                    {rating}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/55 backdrop-blur-md border border-white/10">
                    <NavigationIcon className="w-3 h-3 text-primary" />
                    {distanceKm} km
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_16px_-2px_rgba(248,69,101,0.9)]"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="p-4 bg-white/[0.03] backdrop-blur-xl">
                  <h3 className="font-medium truncate font-display">{theater.name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-gray-400 mt-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{theater.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {amenities.map((a) => {
                      const Icon = AMENITY_ICONS[a.key];
                      return (
                        <span
                          key={a.key}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-white/[0.05] border border-white/10 text-gray-300"
                        >
                          <Icon className="w-3 h-3 text-nebula-cyan" />
                          {a.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <StepNav onBack={back} onContinue={next} continueLabel="Continue to Date" disabled={!state.theater} />
    </div>
  );
};

export default TheaterStep;
