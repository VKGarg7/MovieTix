import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { useAppContext } from "../context/useAppContext";
import TheaterCard from "../components/TheaterCard";
import Loading from "../components/Loading";
import SearchInput from "../components/SearchInput";
import TheaterHero from "../components/theaters/TheaterHero";
import TheaterFilterChips from "../components/theaters/TheaterFilterChips";
import FeaturedTheater from "../components/theaters/FeaturedTheater";
import TheaterMap from "../components/theaters/TheaterMap";
import QuickBookingWidget from "../components/theaters/QuickBookingWidget";
import { getTheaterPresentation } from "../lib/theaterPresentation";
import useDebouncedSearch from "../hooks/useDebouncedSearch";

const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
};

const Theaters = () => {
  const { fetchTheaters, selectedCity } = useAppContext();
  const [theaters, setTheaters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [activeFilter, setActiveFilter] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const rootRef = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 50, damping: 22 });
  const smy = useSpring(my, { stiffness: 50, damping: 22 });
  const spotlightBg = useTransform(
    [smx, smy],
    ([x, y]) => `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.05), transparent 65%)`
  );

  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  useEffect(() => {
    const loadTheaters = async () => {
      const result = await fetchTheaters(selectedCity);
      setTheaters(result);
      setIsLoading(false);
    };
    loadTheaters();
  }, [selectedCity, fetchTheaters]);

  const handleFilterChange = (key) => {
    if (key === "nearby") {
      if (!navigator.geolocation) return;
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setActiveFilter("nearby");
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 8000 }
      );
      return;
    }
    setActiveFilter(key);
  };

  const filteredTheaters = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let list = theaters.filter((t) => {
      const matchesSearch = !term || t.name.toLowerCase().includes(term) || t.address.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      if (activeFilter === "all" || activeFilter === "nearby") return true;

      const { amenities } = getTheaterPresentation(t);
      if (activeFilter === "premium") return amenities.length >= 4;
      return amenities.some((a) => a.key === activeFilter);
    });

    if (activeFilter === "nearby" && userLocation) {
      list = [...list].sort((a, b) => {
        if (!a.geolocation || !b.geolocation) return 0;
        return distanceKm(userLocation, a.geolocation) - distanceKm(userLocation, b.geolocation);
      });
    }

    return list;
  }, [theaters, searchTerm, activeFilter, userLocation]);

  const featured = filteredTheaters[0];
  const rest = filteredTheaters.slice(1);

  if (isLoading) return <Loading />;

  return theaters.length > 0 ? (
    <div ref={rootRef} onMouseMove={handlePointerMove} className="relative pt-36 pb-32 px-6 md:px-16 lg:px-40 xl:px-44 min-h-[80vh]">
      <motion.div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: spotlightBg }} />

      <TheaterHero theaters={theaters} selectedCity={selectedCity} />

      <div className="mb-6">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onClear={() => setSearchInput("")}
          suggestions={["Search theaters...", "Search by name or area...", "Find your nearest screen..."]}
        />
      </div>

      <div className="mb-12">
        <TheaterFilterChips active={activeFilter} onChange={handleFilterChange} locating={locating} />
      </div>

      {filteredTheaters.length > 0 ? (
        <>
          {featured && <FeaturedTheater theater={featured} />}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-14 mb-16">
              {rest.map((theater, i) => (
                <motion.div
                  key={theater._id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex justify-center"
                >
                  <TheaterCard theater={theater} />
                </motion.div>
              ))}
            </div>
          )}

          <TheaterMap theaters={filteredTheaters} />
        </>
      ) : (
        <div className="flex flex-col items-center text-center py-16">
          <h2 className="text-xl font-display font-medium">No theaters match your filters</h2>
          <p className="text-gray-400 mt-2 font-light">Try a different filter or search term.</p>
        </div>
      )}

      <QuickBookingWidget theaters={theaters} />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-display font-medium">
        {selectedCity ? `Coming soon to ${selectedCity}!` : "No Theaters Available"}
      </h1>
      {selectedCity && (
        <p className="text-gray-400 mt-2 font-light">
          We don't have any theaters in {selectedCity} yet — check back soon.
        </p>
      )}
    </div>
  );
};

export default Theaters;
