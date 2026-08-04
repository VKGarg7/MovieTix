import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import {CheckIcon, DeleteIcon, SparklesIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/useAppContext";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import SearchInput from "../../components/SearchInput";
import toast from "react-hot-toast";

const nextDateForDayOfWeek = (dayOfWeek) => {
  const date = new Date();
  const diff = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
};

const AddShows = () => {

  const {axios , user , image_base_url , fetchTheaters , fetchScreens} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [searchInput, setSearchInput, searchTerm] = useDebouncedSearch();
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing");
        if(data.success) {
          setNowPlayingMovies(data.movies);
        }

    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  setDateTimeInput("");
  };
  
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { 
        ...prev, [date]: filteredTimes 
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true)

      if(!selectedMovie || !selectedScreen || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
        return toast('Missing required fields')
      }

      const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({date, time}));

      const payload = {
        movieId: selectedMovie,
        screenId: selectedScreen,
        showsInput,
        showPrice: Number(showPrice)
      }

      const {data} = await axios.post('/api/show/add' , payload)

      if(data.success) {
        toast.success(data.message)
        setSelectedMovie(null)
        setSelectedTheater("")
        setSelectedScreen("")
        setDateTimeSelection({})
        setShowPrice("")
      }else{
        toast.error(data.message)
      }
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred. Please try again.");
    }
    setAddingShow(false)
  }


  useEffect(() => {
      if(user){
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
        const { data } = await axios.get("/api/show/search", {
          params: { query: searchTerm },
        });
        if (!cancelled && data.success) {
          const normalized = data.movies.map((movie) => ({
            id: movie.id ?? movie._id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average ?? 0,
            vote_count: movie.vote_count ?? 0,
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
    return () => { cancelled = true; };
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
        if (!cancelled && data.success) {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Error fetching showtime suggestions:", error);
        if (!cancelled) setSuggestions([]);
      }
      if (!cancelled) setSuggestionsLoading(false);
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [selectedMovie, selectedScreen, axios]);

  const handleAcceptSuggestion = (suggestion) => {
    const date = nextDateForDayOfWeek(suggestion.dayOfWeek);
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (times.includes(suggestion.suggestedTime)) return prev;
      return { ...prev, [date]: [...times, suggestion.suggestedTime] };
    });
    setShowPrice(String(suggestion.suggestedPrice));
    toast.success(`Applied ${suggestion.dayLabel} ${suggestion.suggestedTime} suggestion`);
  };

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />

      <SearchInput
        value={searchInput}
        onChange={setSearchInput}
        onClear={() => setSearchInput("")}
        placeholder="Search for a movie..."
        className="mt-6"
      />

      <p className="mt-6 text-lg font-medium">
        {searchResults ? "Search Results" : "Now Playing Movies"}
      </p>

      {searching ? (
        <p className="text-gray-400 text-sm mt-4">Searching...</p>
      ) : searchResults && searchResults.length === 0 ? (
        <p className="text-gray-400 text-sm mt-4">No movies match "{searchTerm}".</p>
      ) : (
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {(searchResults ?? nowPlayingMovies).map((movie) => (
            <div
              key={movie.id}
              className={`relative max-w-40 cursor-progress group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={image_base_url + movie.poster_path}
                  alt=""
                  className="w-full object-cover brightness-90"
                />

                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>

                  <p className="text-gray-300">
                    {kConverter(movie.vote_count)}Votes
                  </p>
                </div>
              </div>

              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}

              <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* theater and screen selection */}
      <div className="mt-8 flex flex-wrap gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Theater</label>
          <select
            value={selectedTheater}
            onChange={(e) => setSelectedTheater(e.target.value)}
            className="border border-gray-600 bg-transparent px-3 py-2 rounded-md outline-none"
          >
            <option value="" className="text-black">Select a theater</option>
            {theaters.map((theater) => (
              <option key={theater._id} value={theater._id} className="text-black">
                {theater.name} — {theater.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Screen</label>
          <select
            value={selectedScreen}
            onChange={(e) => setSelectedScreen(e.target.value)}
            disabled={!selectedTheater}
            className="border border-gray-600 bg-transparent px-3 py-2 rounded-md outline-none disabled:opacity-50"
          >
            <option value="" className="text-black">Select a screen</option>
            {screens.map((screen) => (
              <option key={screen._id} value={screen._id} className="text-black">
                {screen.name} ({screen.totalCapacity} seats)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMovie && selectedScreen && (
        <div className="mt-8">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Suggested Showtimes
          </label>

          {suggestionsLoading ? (
            <p className="text-gray-400 text-sm">Loading suggestions...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-gray-400 text-sm">No suggestions available.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {suggestions.map((s, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAcceptSuggestion(s)}
                  className="text-left border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition rounded-md px-4 py-3 min-w-48"
                >
                  <p className="font-medium">{s.dayLabel} · {s.suggestedTime}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {currency}{s.suggestedPrice} suggested price
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.basis === 'default'
                      ? 'No history yet — default suggestion'
                      : `${s.avgOccupancyPct}% avg occupancy · ${s.confidence} confidence`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* show price input */}
      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">Show Price</label>

        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            min={0}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter Show Price"
            className="outline-none"
          />
        </div>
      </div>

      {/* date and time selection */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select
          Date
          and
          Time
        </label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />

          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* display selected times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-rose-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer">
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
