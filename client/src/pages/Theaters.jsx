import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";
import { MapPinIcon, MailIcon } from "lucide-react";

const Theaters = () => {
  const { fetchTheaters, selectedCity } = useAppContext();
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheaters = async () => {
      const result = await fetchTheaters(selectedCity);
      setTheaters(result);
      setIsLoading(false);
    };

    loadTheaters();
  }, [selectedCity, fetchTheaters]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen" />;
  }

  return theaters.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-lg font-medium my-4">
        {selectedCity ? `Theaters in ${selectedCity}` : "Our Theaters"}
      </h1>
      <div className="flex flex-wrap max-sm:justify-center gap-6">
        {theaters.map((theater) => (
          <div
            key={theater._id}
            onClick={() => navigate(`/theaters/${theater._id}`)}
            className="flex flex-col gap-2 w-72 rounded-lg bg-primary/10 border border-primary/20 p-5 cursor-pointer hover:-translate-y-1 transition duration-300"
          >
            <h2 className="text-lg font-semibold">{theater.name}</h2>
            <p className="text-sm text-gray-400">{theater.city}</p>
            <div className="flex items-start gap-2 text-sm text-gray-300">
              <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{theater.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MailIcon className="w-4 h-4 shrink-0" />
              <span>{theater.contactEmail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-bold">
        {selectedCity ? `Coming soon to ${selectedCity}!` : "No Theaters Available"}
      </h1>
      {selectedCity && (
        <p className="text-gray-400 mt-2">
          We don't have any theaters in {selectedCity} yet — check back soon.
        </p>
      )}
    </div>
  );
};

export default Theaters;
