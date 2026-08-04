import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import SearchInput from "../components/SearchInput";
import { useAppContext } from "../context/useAppContext";
import useDebouncedSearch from "../hooks/useDebouncedSearch";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const Movies = () => {

  const {shows, selectedTheater, axios} = useAppContext();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);

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
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px"/>
      <BlurCircle bottom="50px" right="50px"/>
      <h1 className="text-lg font-medium my-4">Now Showing</h1>

      <SearchInput
        value={searchInput}
        onChange={setSearchInput}
        onClear={() => setSearchInput("")}
        placeholder="Search movies..."
      />

      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                selectedGenres.includes(genre)
                  ? "bg-primary border-primary text-white"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                selectedLanguages.includes(lang)
                  ? "bg-primary border-primary text-white"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {(() => {
                try {
                  return languageNames.of(lang) ?? lang;
                } catch {
                  return lang;
                }
              })()}
            </button>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-3 text-xs text-gray-400 hover:text-white underline"
        >
          Clear all filters
        </button>
      )}

      {filteredShows.length > 0 ? (
        <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
          {filteredShows.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-16">
          <h2 className="text-xl font-medium">No movies match your filters</h2>
          <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>

          {tmdbLoading && (
            <p className="text-gray-400 mt-6 text-sm">Checking for other matches...</p>
          )}

          {!tmdbLoading && tmdbResults.length > 0 && (
            <div className="mt-8 w-full">
              <p className="text-sm text-gray-400 mb-4">
                Not available to book yet, but found on TMDB:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {tmdbResults.map((movie) => (
                  <div key={movie.id} className="max-w-32 opacity-70">
                    {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt=""
                        className="rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm font-medium truncate mt-1">{movie.title}</p>
                    <p className="text-xs text-gray-500">{movie.release_date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6">
      <h1 className="text-3xl font-bold">No Movies Available</h1>
      {selectedTheater && (
        <p className="text-gray-400 mt-2">
          No upcoming shows at {selectedTheater.name} right now — try another theater.
        </p>
      )}
    </div>
  );
};

export default Movies;
