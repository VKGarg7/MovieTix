import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartIcon } from "lucide-react";
import FlyInCard from "../components/cinematic/FlyInCard";
import PageHeader from "../components/cinematic/PageHeader";
import FavouriteHero from "../components/favourite/FavouriteHero";
import FavouriteStatCards from "../components/favourite/FavouriteStatCards";
import FavouriteCollections from "../components/favourite/FavouriteCollections";
import BecauseYouLoved from "../components/favourite/BecauseYouLoved";
import FavouriteFilters from "../components/favourite/FavouriteFilters";
import FavouriteCard from "../components/favourite/FavouriteCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/useAppContext";
import useDebouncedSearch from "../hooks/useDebouncedSearch";

const Favourite = () => {
  const { user, favoriteMovies, fetchFavoriteMovies } = useAppContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      await fetchFavoriteMovies();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("Recently Added");

  const genres = useMemo(() => {
    const set = new Set();
    favoriteMovies.forEach((m) => m.genres?.forEach((g) => set.add(g.name)));
    return Array.from(set).sort();
  }, [favoriteMovies]);

  const languages = useMemo(() => {
    const set = new Set();
    favoriteMovies.forEach((m) => m.original_language && set.add(m.original_language));
    return Array.from(set).sort();
  }, [favoriteMovies]);

  const toggleGenre = (g) => setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  const toggleLanguage = (l) => setSelectedLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const filteredMovies = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let list = favoriteMovies.filter((m) => {
      const matchesSearch = !term || m.title?.toLowerCase().includes(term);
      const matchesGenre = selectedGenres.length === 0 || m.genres?.some((g) => selectedGenres.includes(g.name));
      const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(m.original_language);
      const matchesRating = (m.vote_average || 0) >= minRating;
      return matchesSearch && matchesGenre && matchesLanguage && matchesRating;
    });

    if (sort === "Recently Added") list = [...list].reverse();
    else if (sort === "Highest Rated") list = [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    else if (sort === "Shortest Runtime") list = [...list].sort((a, b) => (a.runtime || 0) - (b.runtime || 0));
    else if (sort === "Longest Runtime") list = [...list].sort((a, b) => (b.runtime || 0) - (a.runtime || 0));

    return list;
  }, [favoriteMovies, searchTerm, selectedGenres, selectedLanguages, minRating, sort]);

  const hasActiveFilters = searchInput || selectedGenres.length > 0 || selectedLanguages.length > 0 || minRating > 0;

  const clearFilters = () => {
    setSearchInput("");
    setSelectedGenres([]);
    setSelectedLanguages([]);
    setMinRating(0);
  };

  if (loading) return <Loading />;

  if (favoriteMovies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center h-screen text-center px-6 gap-3"
      >
        <HeartIcon className="w-10 h-10 text-gray-600" />
        <h1 className="text-2xl font-display font-medium">No Favourites Yet</h1>
        <p className="text-gray-400 font-light max-w-sm">
          Tap the heart icon on any movie to add it to your favourites.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative pt-36 pb-32 px-6 md:px-16 lg:px-40 xl:px-44 min-h-[80vh]">
      <FavouriteHero movies={favoriteMovies} />
      <FavouriteStatCards movies={favoriteMovies} />

      <FavouriteCollections movies={favoriteMovies} />

      <BecauseYouLoved />

      <PageHeader eyebrow="Browse" title="All Favorites" className="mb-6" />

      <FavouriteFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={() => setSearchInput("")}
        genres={genres}
        selectedGenres={selectedGenres}
        onToggleGenre={toggleGenre}
        languages={languages}
        selectedLanguages={selectedLanguages}
        onToggleLanguage={toggleLanguage}
        minRating={minRating}
        onRatingChange={setMinRating}
        sort={sort}
        onSortChange={setSort}
      />

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mb-6 -mt-4 text-xs text-gray-400 hover:text-white underline cursor-pointer transition-colors"
        >
          Clear all filters
        </button>
      )}

      {filteredMovies.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <div className="flex flex-wrap max-sm:justify-center gap-8">
            {filteredMovies.map((movie, i) => (
              <FlyInCard key={movie._id} index={i}>
                <FavouriteCard movie={movie} index={i} />
              </FlyInCard>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <p className="text-gray-400 text-sm py-10 text-center">No favorites match your filters.</p>
      )}
    </div>
  );
};

export default Favourite;
