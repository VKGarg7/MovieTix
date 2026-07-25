import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppContext } from "./appContextObject";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const SELECTED_CITY_KEY = "movietix_selected_city";
const SELECTED_THEATER_KEY = "movietix_selected_theater";

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const [selectedCity, setSelectedCityState] = useState(
    () => localStorage.getItem(SELECTED_CITY_KEY) || ""
  );
  const [selectedTheater, setSelectedTheaterState] = useState(() => {
    const stored = localStorage.getItem(SELECTED_THEATER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const setSelectedCity = (city) => {
    setSelectedCityState(city);
    if (city) {
      localStorage.setItem(SELECTED_CITY_KEY, city);
    } else {
      localStorage.removeItem(SELECTED_CITY_KEY);
    }
    // changing city invalidates whichever theater was picked under the old city
    setSelectedTheater(null);
  };

  const setSelectedTheater = (theater) => {
    setSelectedTheaterState(theater);
    if (theater) {
      localStorage.setItem(SELECTED_THEATER_KEY, JSON.stringify(theater));
    } else {
      localStorage.removeItem(SELECTED_THEATER_KEY);
    }
  };

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${await getToken()}` }})
      setIsAdmin(data.isAdmin === true);
    } catch {
      // the server answers 403 for non-admins
      setIsAdmin(false);
      if (location.pathname.startsWith("/admin")) {
        navigate("/")
        toast.error("You are not authorized to access this page.")
      }
    }
  }

  const fetchShows = useCallback(async (theaterId) => {
    try {
      const { data } = await axios.get("/api/show/all", {
        params: theaterId ? { theaterId } : undefined,
      });
      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // city is optional — pass it to filter server-side, or omit to fetch all theaters.
  const fetchTheaters = useCallback(async (city) => {
    try {
      const { data } = await axios.get("/api/theater", {
        params: city ? { city } : undefined,
      });
      if (data.success) {
        return data.theaters;
      }
      toast.error(data.message);
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const fetchScreens = useCallback(async (theaterId) => {
    try {
      const { data } = await axios.get("/api/screen", { params: { theaterId } });
      if (data.success) {
        return data.screens;
      }
      toast.error(data.message);
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  // theaterId is optional — pass it to filter showtimes to that theater, or omit for all.
  const fetchShowDetails = useCallback(async (movieId, theaterId) => {
    try {
      const { data } = await axios.get(`/api/show/${movieId}`, {
        params: theaterId ? { theaterId } : undefined,
      });
      if (data.success) {
        return data;
      }
      toast.error(data.message);
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${await getToken()}` }});

        if (data.success) {
        setFavoriteMovies(data.movies)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShows(selectedTheater?._id);
  }, [selectedTheater, fetchShows]);

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
    // fetchIsAdmin/fetchFavoriteMovies close over getToken/location/navigate,
    // which aren't referentially stable — only re-run this when the user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    fetchTheaters,
    fetchScreens,
    fetchShowDetails,
    image_base_url,
    selectedCity,
    setSelectedCity,
    selectedTheater,
    setSelectedTheater,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
