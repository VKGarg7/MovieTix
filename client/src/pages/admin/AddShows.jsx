import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import Loading from "../../components/Loading";
import { SparklesIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import SearchInput from "../../components/SearchInput";
import toast from "react-hot-toast";

import TheaterPickerDropdown from "../../components/admin/addshow/TheaterPickerDropdown";
import ScreenPickerCards from "../../components/admin/addshow/ScreenPickerCards";
import MoviePickerCarousel from "../../components/admin/addshow/MoviePickerCarousel";
import SelectedMoviePreview from "../../components/admin/addshow/SelectedMoviePreview";
import DateTimeScheduler from "../../components/admin/addshow/DateTimeScheduler";
import PricingPanel from "../../components/admin/addshow/PricingPanel";
import MysteryMovieConfigCard from "../../components/admin/addshow/MysteryMovieConfigCard";
import ValidationChecklist from "../../components/admin/addshow/ValidationChecklist";
import LiveSummaryCard from "../../components/admin/addshow/LiveSummaryCard";
import AddShowActionBar from "../../components/admin/addshow/AddShowActionBar";
import PreviewModal from "../../components/admin/addshow/PreviewModal";

const nextDateForDayOfWeek = (dayOfWeek) => {
  const date = new Date();
  const diff = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
};

const AddShows = () => {
  const { axios, user, image_base_url, fetchTheaters, fetchScreens } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);
  const [isMysteryMovie, setIsMysteryMovie] = useState(false);
  const [mysteryRevealAt, setMysteryRevealAt] = useState("onBooking");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState("");
  const [theaterDropdownOpen, setTheaterDropdownOpen] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const rootRef = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 50, damping: 22 });
  const smy = useSpring(my, { stiffness: 50, damping: 22 });
  const spotlightBg = useTransform(
    [smx, smy],
    ([x, y]) => `radial-gradient(700px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.035), transparent 65%)`
  );
  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing");
      if (data.success) setNowPlayingMovies(data.movies);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleDateTimeAdd = (date, time) => {
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (times.includes(time)) return prev;
      return { ...prev, [date]: [...times, time] };
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setSelectedTheater("");
    setSelectedScreen("");
    setDateTimeSelection({});
    setShowPrice("");
    setIsMysteryMovie(false);
    setMysteryRevealAt("onBooking");
    setSearchInput("");
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);

      if (!selectedMovie || !selectedScreen || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
        toast("Missing required fields");
        return;
      }

      const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({ date, time }));

      const payload = {
        movieId: selectedMovie,
        screenId: selectedScreen,
        showsInput,
        showPrice: Number(showPrice),
        isMysteryMovie,
        mysteryRevealAt,
      };

      const { data } = await axios.post("/api/show/add", payload);

      if (data.success) {
        toast.success(data.message);
        resetForm();
        setPreviewOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred. Please try again.");
    }
    setAddingShow(false);
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
      fetchTheaters().then(setTheaters);
    }
    // fetchNowPlayingMovies is a new function each render and intentionally
    // excluded so this only re-runs when the user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchTheaters]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults(null);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setSearching(true);
      try {
        const { data } = await axios.get("/api/show/search", { params: { query: searchTerm } });
        if (!cancelled && data.success) {
          const normalized = data.movies.map((movie) => ({
            id: movie.id ?? movie._id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average ?? 0,
            vote_count: movie.vote_count ?? 0,
            original_language: movie.original_language,
            overview: movie.overview,
          }));
          setSearchResults(normalized);
        }
      } catch (error) {
        console.error("Error searching movies:", error);
        if (!cancelled) toast.error("Search failed. Please try again.");
      }
      if (!cancelled) setSearching(false);
    };

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, axios]);

  useEffect(() => {
    setSelectedScreen("");
    if (selectedTheater) {
      fetchScreens(selectedTheater).then(setScreens);
    } else {
      setScreens([]);
    }
  }, [selectedTheater, fetchScreens]);

  useEffect(() => {
    if (!selectedMovie || !selectedScreen) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const { data } = await axios.get("/api/show/suggest-showtimes", {
          params: { movieId: selectedMovie, screenId: selectedScreen },
        });
        if (!cancelled && data.success) setSuggestions(data.suggestions);
      } catch (error) {
        console.error("Error fetching showtime suggestions:", error);
        if (!cancelled) setSuggestions([]);
      }
      if (!cancelled) setSuggestionsLoading(false);
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [selectedMovie, selectedScreen, axios]);

  const handleAcceptSuggestion = (suggestion) => {
    const date = nextDateForDayOfWeek(suggestion.dayOfWeek);
    handleDateTimeAdd(date, suggestion.suggestedTime);
    setShowPrice(String(suggestion.suggestedPrice));
    toast.success(`Applied ${suggestion.dayLabel} ${suggestion.suggestedTime} suggestion`);
  };

  const moviePool = searchResults ?? nowPlayingMovies;
  const selectedMovieObj = useMemo(() => moviePool.find((m) => m.id === selectedMovie) || null, [moviePool, selectedMovie]);
  const selectedTheaterObj = theaters.find((t) => t._id === selectedTheater) || null;
  const selectedScreenObj = screens.find((s) => s._id === selectedScreen) || null;
  const canPublish = Boolean(selectedMovie && selectedScreen && Object.keys(dateTimeSelection).length > 0 && Number(showPrice) > 0);

  if (nowPlayingMovies.length === 0) return <Loading />;

  return (
    <div ref={rootRef} onMouseMove={handlePointerMove} className="relative">
      {/* cinematic ambient background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -left-10 w-[30rem] h-[30rem] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, rgba(109,92,255,0.5), transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-20 w-[26rem] h-[26rem] rounded-full blur-[120px] opacity-15"
          style={{ background: "radial-gradient(circle, rgba(63,216,224,0.45), transparent 70%)" }}
        />
        <div className="noise-overlay absolute inset-0" />
        <motion.div className="absolute inset-0" style={{ background: spotlightBg }} />
      </div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="section-eyebrow mb-2">Cinema Operations</p>
        <h1 className="font-display text-3xl font-medium">Schedule a Show</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-8 min-w-0">
          <section className="glass-panel p-5">
            <p className="text-sm font-medium mb-3">Movie</p>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onClear={() => setSearchInput("")}
              suggestions={["Search for a movie…", "Try a title or keyword…"]}
              className="mb-4"
            />
            {searching ? (
              <p className="text-gray-400 text-sm">Searching…</p>
            ) : searchResults && searchResults.length === 0 ? (
              <p className="text-gray-400 text-sm">No movies match "{searchTerm}".</p>
            ) : (
              <MoviePickerCarousel
                movies={moviePool}
                selectedMovie={selectedMovie}
                onSelect={setSelectedMovie}
                imageBaseUrl={image_base_url}
              />
            )}
          </section>

          <section className={`glass-panel p-5 relative ${theaterDropdownOpen ? "z-20" : "z-0"}`}>
            <p className="text-sm font-medium mb-3">Theater & Screen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <TheaterPickerDropdown
                theaters={theaters}
                value={selectedTheater}
                onChange={setSelectedTheater}
                onOpenChange={setTheaterDropdownOpen}
              />
            </div>
            <ScreenPickerCards screens={screens} value={selectedScreen} onChange={setSelectedScreen} />
          </section>

          {selectedMovie && selectedScreen && (
            <section className="glass-panel p-5">
              <p className="flex items-center gap-2 text-sm font-medium mb-3">
                <SparklesIcon className="w-4 h-4 text-nebula-violet" /> Suggested Showtimes
              </p>
              {suggestionsLoading ? (
                <p className="text-gray-400 text-sm">Loading suggestions…</p>
              ) : suggestions.length === 0 ? (
                <p className="text-gray-400 text-sm">No suggestions available.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAcceptSuggestion(s)}
                      className="text-left border border-nebula-violet/25 hover:border-nebula-violet/50 bg-nebula-violet/[0.04] hover:bg-nebula-violet/10 transition-colors rounded-xl px-4 py-3 min-w-48 cursor-pointer"
                    >
                      <p className="font-medium text-sm">{s.dayLabel} · {s.suggestedTime}</p>
                      <p className="text-xs text-gray-400 mt-1">{currency}{s.suggestedPrice} suggested price</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {s.basis === "default" ? "No history yet — default suggestion" : `${s.avgOccupancyPct}% avg occupancy · ${s.confidence} confidence`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="glass-panel p-5">
            <p className="text-sm font-medium mb-3">Schedule</p>
            <DateTimeScheduler dateTimeSelection={dateTimeSelection} onAdd={handleDateTimeAdd} onRemove={handleRemoveTime} />
          </section>

          <section className="glass-panel p-5">
            <p className="text-sm font-medium mb-3">Pricing</p>
            <PricingPanel
              showPrice={showPrice}
              onPriceChange={setShowPrice}
              theaterId={selectedTheater}
              dateTimeSelection={dateTimeSelection}
              currency={currency}
            />
          </section>

          <MysteryMovieConfigCard
            isMysteryMovie={isMysteryMovie}
            onToggle={setIsMysteryMovie}
            mysteryRevealAt={mysteryRevealAt}
            onRevealChange={setMysteryRevealAt}
          />

          <AddShowActionBar
            onCancel={resetForm}
            onPreview={() => setPreviewOpen(true)}
            onPublish={handleSubmit}
            publishing={addingShow}
            canPublish={canPublish}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="glass-panel p-5">
            <p className="section-eyebrow mb-4">Live Preview</p>
            <SelectedMoviePreview movie={selectedMovieObj} imageBaseUrl={image_base_url} />
          </div>

          <LiveSummaryCard
            movie={selectedMovieObj}
            theater={selectedTheaterObj}
            screen={selectedScreenObj}
            showPrice={showPrice}
            dateTimeSelection={dateTimeSelection}
            currency={currency}
          />

          <ValidationChecklist
            selectedMovie={selectedMovie}
            selectedTheater={selectedTheater}
            selectedScreen={selectedScreen}
            dateTimeSelection={dateTimeSelection}
            showPrice={showPrice}
          />
        </div>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        movie={selectedMovieObj}
        theater={selectedTheaterObj}
        screen={selectedScreenObj}
        showPrice={showPrice}
        dateTimeSelection={dateTimeSelection}
        isMysteryMovie={isMysteryMovie}
        mysteryRevealAt={mysteryRevealAt}
        currency={currency}
        imageBaseUrl={image_base_url}
      />
    </div>
  );
};

export default AddShows;
