import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import MovieCard from "../components/MovieCard";
import FlyInCard from "../components/cinematic/FlyInCard";
import SearchInput from "../components/SearchInput";
import PillOptionSelector from "../components/PillOptionSelector";
import PageHeader from "../components/cinematic/PageHeader";
import LoadMoreButton from "../components/cinematic/LoadMoreButton";
import { useAppContext } from "../context/useAppContext";
import useDebouncedSearch from "../hooks/useDebouncedSearch";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const PAGE_SIZE = 12;

const Movies = () => {

  const {shows, selectedTheater, axios} = useAppContext();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const rootRef = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 50, damping: 22 });
  const smy = useSpring(my, { stiffness: 50, damping: 22 });
  const spotlightBg = useTransform([smx, smy], ([x, y]) => `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.05), transparent 65%)`);

  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  useEffect(() => {
    const q = searchParams.get("q");
    setSearchInput(q || "");

    const genre = searchParams.get("genre");
    setSelectedGenres(genre ? [genre] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const genres = useMemo(() => {
    const set = new Set();
    shows.forEach((movie) => movie.genres?.forEach((g) => set.add(g.name)));
    return Array.from(set).sort();
  }, [shows]);

  const languages = useMemo(() => {
    const set = new Set();
    shows.forEach((movie) => movie.original_language && set.add(movie.original_language));
    return Array.from(set).sort();
  }, [shows]);

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const filteredShows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return shows.filter((movie) => {
      const matchesSearch = !term || movie.title?.toLowerCase().includes(term);
      const matchesGenre =
        selectedGenres.length === 0 ||
        movie.genres?.some((g) => selectedGenres.some((sg) => sg.toLowerCase() === g.name.toLowerCase()));
      const matchesLanguage =
        selectedLanguages.length === 0 ||
        selectedLanguages.includes(movie.original_language);
      return matchesSearch && matchesGenre && matchesLanguage;
    });
  }, [shows, searchTerm, selectedGenres, selectedLanguages]);

  const hasActiveFilters =
    searchInput || selectedGenres.length > 0 || selectedLanguages.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setSelectedGenres([]);
    setSelectedLanguages([]);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedGenres, selectedLanguages]);

  const visibleShows = filteredShows.slice(0, visibleCount);
  const hasMore = visibleCount < filteredShows.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  };

  useEffect(() => {
    if (searchTerm.length < 2 || filteredShows.length > 0) {
      setTmdbResults([]);
      return;
    }

    let cancelled = false;

    const runFallbackSearch = async () => {
      setTmdbLoading(true);
      try {
        const { data } = await axios.get("/api/show/all/search", {
          params: { query: searchTerm },
        });
        if (!cancelled && data.success && data.source === "tmdb") {
          setTmdbResults(data.movies);
        } else if (!cancelled) {
          setTmdbResults([]);
        }
      } catch (error) {
        console.error("Error searching TMDB:", error);
        if (!cancelled) setTmdbResults([]);
      }
      if (!cancelled) setTmdbLoading(false);
    };

    runFallbackSearch();
    return () => { cancelled = true; };
  }, [searchTerm, filteredShows.length, axios]);

  return shows.length > 0 ? (
    <div
      ref={rootRef}
      onMouseMove={handlePointerMove}
      className="relative pt-36 pb-32 px-6 md:px-16 lg:px-40 xl:px-44 min-h-[80vh]"
    >
      <motion.div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: spotlightBg }} />

      <PageHeader eyebrow="Browse" title="Now Showing" />

      <SearchInput
        value={searchInput}
        onChange={setSearchInput}
        onClear={() => setSearchInput("")}
        suggestions={["Search movies...", "Try \"action\" or \"comedy\"...", "Search by title...", "What are you in the mood for?"]}
      />

      {genres.length > 0 && (
        <div className="mt-5">
          <PillOptionSelector options={genres} value={selectedGenres} onChange={toggleGenre} multiple />
        </div>
      )}

      {languages.length > 0 && (
        <div className="mt-2.5">
          <PillOptionSelector
            options={languages}
            value={selectedLanguages}
            onChange={toggleLanguage}
            multiple
            renderLabel={(lang) => {
              try {
                return languageNames.of(lang) ?? lang;
              } catch {
                return lang;
              }
            }}
          />
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-4 text-xs text-gray-400 hover:text-white underline cursor-pointer transition-colors"
        >
          Clear all filters
        </button>
      )}

      {filteredShows.length > 0 ? (
        <>
          <div className="flex flex-wrap max-sm:justify-center gap-8 mt-10">
            {visibleShows.map((movie, i) => (
              <FlyInCard key={movie._id} index={i}>
                <MovieCard movie={movie} />
              </FlyInCard>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-16">
              <LoadMoreButton onClick={handleLoadMore} remaining={filteredShows.length - visibleCount} loading={loadingMore} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center text-center py-16">
          <h2 className="text-xl font-display font-medium">No movies match your filters</h2>
          <p className="text-gray-400 mt-2 font-light">Try adjusting your search or filters.</p>

          {tmdbLoading && (
            <p className="text-gray-400 mt-6 text-sm">Checking for other matches...</p>
          )}

          {!tmdbLoading && tmdbResults.length > 0 && (
            <div className="mt-8 w-full">
              <p className="text-sm text-gray-400 mb-4">
                Not available to book yet, but found on TMDB:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {tmdbResults.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="max-w-32 opacity-70"
                  >
                    {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="rounded-xl object-cover"
                      />
                    )}
                    <p className="text-sm font-medium truncate mt-1">{movie.title}</p>
                    <p className="text-xs text-gray-400">{movie.release_date}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-display font-medium">No Movies Available</h1>
      {selectedTheater && (
        <p className="text-gray-400 mt-2 font-light">
          No upcoming shows at {selectedTheater.name} right now — try another theater.
        </p>
      )}
    </div>
  );
};

export default Movies;
