import React, { useEffect, useState } from "react";
import { XIcon, MapPinIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-[#1f1f24] border border-primary/20 p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {dismissible && (
          <XIcon
            className="absolute top-4 right-4 w-5 h-5 cursor-pointer text-gray-400 hover:text-white"
            onClick={onClose}
          />
        )}

        {step === "city" ? (
          <>
            <h2 className="text-lg font-semibold mb-1">Select your city</h2>
            <p className="text-sm text-gray-400 mb-5">
              We'll show theaters and showtimes near you.
            </p>

            {isLoading ? (
              <p className="text-sm text-gray-400">Loading cities...</p>
            ) : cities.length === 0 ? (
              <p className="text-sm text-gray-400">No cities available yet. Check back soon.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handlePickCity(city)}
                    className="px-4 py-2 rounded border border-primary/40 hover:bg-primary/20 text-sm cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("city")}
              className="text-xs text-gray-400 hover:text-white mb-3 cursor-pointer"
            >
              &larr; Change city
            </button>

            <h2 className="text-lg font-semibold mb-1">Select a theater in {pickedCity}</h2>
            <p className="text-sm text-gray-400 mb-5">
              Showtimes will be filtered to this theater.
            </p>

            {theatersInCity.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">
                No theaters in {pickedCity} yet — coming soon!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {theatersInCity.map((theater) => (
                  <button
                    key={theater._id}
                    onClick={() => handlePickTheater(theater)}
                    className="flex items-start gap-2 text-left px-4 py-3 rounded border border-primary/40 hover:bg-primary/20 cursor-pointer"
                  >
                    <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{theater.name}</p>
                      <p className="text-xs text-gray-400">{theater.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CityTheaterModal;
