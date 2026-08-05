import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MovieCard from "./MovieCard";
import SectionHeader from "./cinematic/SectionHeader";
import CategoryPills from "./cinematic/CategoryPills";
import MovieCarousel from "./cinematic/MovieCarousel";
import { useAppContext } from "../context/useAppContext";

const ALL = "All";
const NEW_RELEASES = "New Releases";
const TOP_RATED = "Top Rated";
const NEW_RELEASE_WINDOW_DAYS = 30;

const FeatureSection = () => {
  const navigate = useNavigate();
  const { shows } = useAppContext();
  const [active, setActive] = useState(ALL);

  const categories = useMemo(() => {
    const genreSet = new Set();
    shows.forEach((m) => m.genres?.forEach((g) => genreSet.add(g.name)));
    return [ALL, NEW_RELEASES, TOP_RATED, ...Array.from(genreSet).sort()];
  }, [shows]);

  const filtered = useMemo(() => {
    if (active === ALL) return shows;
    if (active === NEW_RELEASES) {
      const cutoff = Date.now() - NEW_RELEASE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      return shows.filter((m) => m.release_date && new Date(m.release_date).getTime() >= cutoff);
    }
    if (active === TOP_RATED) {
      return [...shows].filter((m) => m.vote_average >= 7).sort((a, b) => b.vote_average - a.vote_average);
    }
    return shows.filter((m) => m.genres?.some((g) => g.name === active));
  }, [shows, active]);

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden pt-40 pb-16">
      <SectionHeader
        eyebrow="Now Screening"
        title="Now Showing"
        subtitle="Currently Lighting Up The Big Screen"
        actionLabel="View All"
        onAction={() => navigate("/movies")}
      />

      <div className="mb-10">
        <CategoryPills options={categories} active={active} onChange={setActive} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-10">No movies in this category right now.</p>
      ) : (
        <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <MovieCarousel>
            {filtered.map((show) => (
              <MovieCard key={show._id} movie={show} />
            ))}
          </MovieCarousel>
        </motion.div>
      )}

      <div className="flex justify-center mt-20">
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="btn-glow px-10 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10"
        >
          Show More
        </motion.button>
      </div>
    </div>
  );
};

export default FeatureSection;
