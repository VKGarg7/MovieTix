import React, { useState } from "react";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import InlineSpinner from "../../components/admin/InlineSpinner";
import OccupancyBar from "../../components/OccupancyBar";
import { useAppContext } from "../../context/useAppContext";
import useFetchOnUser from "../../hooks/useFetchOnUser";
import usePolling from "../../hooks/usePolling";
import toast from "react-hot-toast";

const POLL_INTERVAL_MS = 60000;

const MultiplexPulse = () => {
  const { axios, user, adminRole, fetchTheaters } = useAppContext();

  const [theaters, setTheaters] = useState([]);
  const [theaterId, setTheaterId] = useState("");
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFetchOnUser(user, () => fetchTheaters().then(setTheaters));

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get("/api/admin/occupancy-pulse", {
        params: theaterId ? { theaterId } : {},
      });
      if (isCancelled()) return;
      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (!isCancelled()) {
        toast.error("Failed to fetch occupancy pulse");
        console.error(error);
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { enabled: Boolean(user), deps: [user, theaterId] });

  return (
    <>
      <Title text1="Multiplex" text2="Pulse" />

      <div className="flex flex-wrap items-end justify-between gap-4 mt-6">
        <p className="text-gray-400 text-sm">
          Live occupancy for every upcoming show in the next 24 hours, refreshed every 60s.
        </p>
        {adminRole === "superAdmin" && theaters.length > 0 && (
          <label className="flex flex-col text-sm text-gray-400 gap-1">
            Theater
            <select
              value={theaterId}
              onChange={(e) => setTheaterId(e.target.value)}
              className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2 text-white outline-none"
            >
              <option value="" className="bg-[#1a1a1c] text-white">All theaters</option>
              {theaters.map((t) => (
                <option key={t._id} value={t._id} className="bg-[#1a1a1c] text-white">{t.name} · {t.city}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="relative mt-6">
        <BlurCircle top="-100px" left="0px" />

        {loading ? (
          <InlineSpinner />
        ) : shows.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming shows in the next 24 hours.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shows.map((show) => (
              <div
                key={show._id}
                className="bg-primary/10 border border-primary/20 rounded-md p-4 flex flex-col gap-2"
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
    </>
  );
};

export default MultiplexPulse;
