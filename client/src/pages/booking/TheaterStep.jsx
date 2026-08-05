import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPinIcon, StarIcon, NavigationIcon, CheckIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import { getTheaterPresentation } from "../../lib/theaterPresentation";
import TheaterArt from "../../components/cinematic/TheaterArt";
import Loading from "../../components/Loading";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {theaters.map((theater, i) => {
            const { palette, rating, distanceKm } = getTheaterPresentation(theater);
            const isSelected = state.theater?._id === theater._id;
            return (
              <motion.button
                key={theater._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                whileHover={{ y: -6 }}
                onClick={() => pickTheater(theater)}
                className={`relative text-left rounded-[24px] overflow-hidden border transition-colors cursor-pointer ${
                  isSelected ? "border-primary" : "border-white/10 hover:border-white/25"
                }`}
                style={isSelected ? { boxShadow: "0 0 30px -8px rgba(248,69,101,0.6)" } : undefined}
              >
                <div className="relative h-28 w-full">
                  <TheaterArt palette={palette} name={theater.name} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <CheckIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/[0.03] backdrop-blur-xl">
                  <h3 className="font-medium truncate">{theater.name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-gray-400 mt-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{theater.address}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-nebula-amber fill-nebula-amber" />{rating}</span>
                    <span className="flex items-center gap-1"><NavigationIcon className="w-3 h-3 text-primary" />{distanceKm} km</span>
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
