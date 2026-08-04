import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import OccupancyBar from "../components/OccupancyBar";
import Loading from "../components/Loading";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 60000;

const TheaterDetails = () => {
  const { id } = useParams();
  const { axios, fetchTheaters } = useAppContext();

  const [theater, setTheater] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTheater = async () => {
      const theaters = await fetchTheaters();
      if (!cancelled) setTheater(theaters.find((t) => t._id === id) || null);
    };
    loadTheater();
    return () => { cancelled = true; };
  }, [id, fetchTheaters]);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get("/api/show/occupancy-pulse", { params: { theaterId: id } });
      if (!isCancelled() && data.success) setShows(data.shows);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { deps: [id, axios] });

  if (loading) return <Loading />;

  return (
    <div className="px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">{theater?.name || "Theater"}</h1>
      <p className="text-gray-400 text-sm mb-8">{theater?.address}</p>

      <p className="text-lg font-medium mb-4">Live Occupancy — Next 24 Hours</p>

      {shows.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming shows in the next 24 hours.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shows.map((show) => (
            <div
              key={show._id}
              className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col gap-2"
            >
              <p className="font-medium truncate">{show.title}</p>
              <p className="text-xs text-gray-400">
                {show.screenName} &middot; {new Date(show.showDateTime).toLocaleString()}
              </p>
              <OccupancyBar occupancyPct={show.occupancyPct} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TheaterDetails;
