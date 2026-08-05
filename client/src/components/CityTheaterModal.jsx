import React, { useEffect, useState } from "react";
import { XIcon, MapPinIcon, ArrowLeftIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/useAppContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const CityTheaterModal = ({ onClose, dismissible = true }) => {
  const { fetchTheaters, selectedCity, setSelectedCity, setSelectedTheater } = useAppContext();

  const [theaters, setTheaters] = useState([]);
  const [cities, setCities] = useState([]);
  const [step, setStep] = useState(selectedCity ? "theater" : "city");
  const [pickedCity, setPickedCity] = useState(selectedCity || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheaters = async () => {
      const allTheaters = await fetchTheaters();
      setTheaters(allTheaters);
      setCities([...new Set(allTheaters.map((t) => t.city))].sort());
      setIsLoading(false);
    };

    loadTheaters();
  }, [fetchTheaters]);

  const theatersInCity = theaters.filter((t) => t.city === pickedCity);

  const handlePickCity = (city) => {
    setPickedCity(city);
    setStep("theater");
  };

  const handlePickTheater = (theater) => {
    setSelectedCity(pickedCity);
    setSelectedTheater(theater);
    onClose();
  };

  const handleBackdropClick = () => {
    if (dismissible) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative w-full max-w-md glass-panel p-7 max-h-[80vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #6D5CFF, transparent 70%)" }} />

        {dismissible && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer"
          >
            <XIcon className="w-4 h-4 text-gray-300" />
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {step === "city" ? (
            <motion.div
              key="city"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="section-eyebrow mb-2">Welcome</p>
              <h2 className="text-2xl font-display font-medium mb-1">Select Your City</h2>
              <p className="text-sm text-gray-400 mb-6 font-light">
                We'll show theaters and showtimes near you.
              </p>

              {isLoading ? (
                <p className="text-sm text-gray-400">Loading cities...</p>
              ) : cities.length === 0 ? (
                <p className="text-sm text-gray-400">No cities available yet. Check back soon.</p>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
                  {cities.map((city) => (
                    <motion.button
                      key={city}
                      variants={item}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePickCity(city)}
                      className="px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-primary/50 hover:bg-primary/10 text-sm cursor-pointer transition-colors"
                    >
                      {city}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="theater"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setStep("city")}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-4 cursor-pointer transition-colors"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                Change city
              </button>

              <p className="section-eyebrow mb-2">In {pickedCity}</p>
              <h2 className="text-2xl font-display font-medium mb-1">Select a Theater</h2>
              <p className="text-sm text-gray-400 mb-6 font-light">
                Showtimes will be filtered to this theater.
              </p>

              {theatersInCity.length === 0 ? (
                <div className="text-sm text-gray-400 py-6 text-center">
                  No theaters in {pickedCity} yet — coming soon!
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
                  {theatersInCity.map((theater) => (
                    <motion.button
                      key={theater._id}
                      variants={item}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePickTheater(theater)}
                      className="flex items-start gap-3 text-left px-4 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-primary/50 hover:bg-primary/10 cursor-pointer transition-colors"
                    >
                      <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{theater.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{theater.address}</p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CityTheaterModal;
