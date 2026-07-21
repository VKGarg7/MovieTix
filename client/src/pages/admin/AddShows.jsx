import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import {CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddShows = () => {

  const {axios , getToken , user , image_base_url} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  const [theaters, setTheaters] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState("");


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

      const {data} = await axios.post('/api/show/add' , payload , {headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success) {
        toast.success(data.message)
        setSelectedMovie(null)
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
      if(!user) return;

      const fetchNowPlayingMovies = async () => {
        try {
          const { data } = await axios.get("/api/show/now-playing", {
            headers: { Authorization: `Bearer ${await getToken()}` }})
          if(data.success) {
            setNowPlayingMovies(data.movies);
          }
        } catch (error) {
          console.error("Error fetching movies:", error);
        }
      };
      fetchNowPlayingMovies();

      const fetchTheaters = async () => {
        try {
          const { data } = await axios.get("/api/theater/all", {
            headers: { Authorization: `Bearer ${await getToken()}` }})
          if (data.success) {
            setTheaters(data.theaters);
          }
        } catch (error) {
          console.error("Error fetching theaters:", error);
        }
      };
      fetchTheaters();
  }, [user, axios, getToken]);

  const allScreens = theaters.flatMap((theater) =>
    theater.screens.map((screen) => ({ ...screen, theaterName: theater.name, theaterCity: theater.city }))
  );

  
  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className="mt-10 text-xl font-semibold tracking-tight">Now Playing Movies</p>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <div className={`relative rounded-xl overflow-hidden border-2 transition-colors duration-300 ${selectedMovie === movie.id ? 'border-primary' : 'border-transparent'}`}>
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
                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded-full shadow-[var(--shadow-glow)]">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}

              <p className="font-medium truncate mt-2">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* screen selection */}
      <div className="mt-8">
        <label className="block text-sm font-medium mb-2 text-gray-300">Theater & Screen</label>
        {allScreens.length === 0 ? (
          <p className="text-sm text-gray-400">
            No screens available. Add a theater and screen from the Theaters page first.
          </p>
        ) : (
          <select
            value={selectedScreen}
            onChange={(e) => setSelectedScreen(e.target.value)}
            className="border border-white/15 bg-white/5 px-3 py-2.5 rounded-lg outline-none text-sm hover:border-white/25 transition-colors"
          >
            <option value="" className="bg-black">Select a screen</option>
            {allScreens.map((screen) => (
              <option key={screen._id} value={screen._id} className="bg-black">
                {screen.theaterName} ({screen.theaterCity}) — {screen.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* show price input */}
      <div className="mt-8">
        <label className="block text-sm font-medium mb-2 text-gray-300">Show Price</label>

        <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2.5 rounded-lg hover:border-white/25 transition-colors">
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
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Select
          Date
          and
          Time
        </label>
        <div className="inline-flex gap-5 border border-white/15 bg-white/5 p-1 pl-3 rounded-lg hover:border-white/25 transition-colors">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />

          <button
            onClick={handleDateTimeAdd}
            className="btn-primary text-white px-3 py-2 text-sm rounded-md cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* display selected times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-medium text-gray-300">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary/40 bg-primary/10 px-2.5 py-1 flex items-center rounded-full"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleSubmit} disabled={addingShow} className="btn-primary text-white px-8 py-2.5 mt-8 rounded-full font-medium cursor-pointer disabled:opacity-50">
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
