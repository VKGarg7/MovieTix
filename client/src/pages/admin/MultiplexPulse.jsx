import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/useAppContext";
import useFetchOnUser from "../../hooks/useFetchOnUser";
import usePolling from "../../hooks/usePolling";
import toast from "react-hot-toast";

import OperationsCenterHeader from "../../components/admin/pulse/OperationsCenterHeader";
import LiveStatusBar from "../../components/admin/pulse/LiveStatusBar";
import PulseKpiRow from "../../components/admin/pulse/PulseKpiRow";
import PulseFilterBar from "../../components/admin/pulse/PulseFilterBar";
import LiveShowCard from "../../components/admin/pulse/LiveShowCard";
import OccupancyHeatmap from "../../components/admin/pulse/OccupancyHeatmap";
import TheaterScreenGrid from "../../components/admin/pulse/TheaterScreenGrid";
import LiveActivitySidebar from "../../components/admin/pulse/LiveActivitySidebar";
import OperationsAIAlerts from "../../components/admin/pulse/OperationsAIAlerts";
import UpcomingTimeline from "../../components/admin/pulse/UpcomingTimeline";
import { getLiveStatus, occupancyTier } from "../../lib/pulseStatus";

const POLL_INTERVAL_MS = 60000;

const DEFAULT_FILTERS = { query: "", theater: "all", movie: "all", screen: "all", occupancy: "all", time: "all", status: "all" };

const MultiplexPulse = () => {
  const { axios, user, adminRole, fetchTheaters, image_base_url } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  const [theaters, setTheaters] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [activityEvents, setActivityEvents] = useState([]);
  const prevShowsRef = useRef({});
  const containerRef = useRef(null);

  useFetchOnUser(user, () => fetchTheaters().then(setTheaters));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchPulse = async (isCancelled) => {
    try {
      const { data } = await axios.get("/api/admin/occupancy-pulse", {
        params: filters.theater !== "all" ? { theaterId: filters.theater } : {},
      });
      if (isCancelled()) return;
      if (data.success) {
        const nextShows = data.shows;

        const prev = prevShowsRef.current;
        const newEvents = [];
        nextShows.forEach((s) => {
          const before = prev[s._id];
          if (before && s.occupiedCount > before.occupiedCount) {
            const delta = s.occupiedCount - before.occupiedCount;
            newEvents.push({ id: `${s._id}-${Date.now()}`, text: `${delta} seat${delta > 1 ? "s" : ""} booked for ${s.title}` });
          }
          if (before && before.occupancyPct < 90 && s.occupancyPct >= 90) {
            newEvents.push({ id: `${s._id}-near-${Date.now()}`, text: `${s.title} reached ${Math.round(s.occupancyPct)}% occupancy` });
          }
          if (!before) {
            newEvents.push({ id: `${s._id}-start-${Date.now()}`, text: `${s.title} now tracked at ${s.screenName}` });
          }
        });
        if (newEvents.length > 0) {
          setActivityEvents((prevEvents) => [...newEvents.reverse(), ...prevEvents].slice(0, 25));
        }
        prevShowsRef.current = Object.fromEntries(nextShows.map((s) => [s._id, s]));

        setShows(nextShows);
        setLastUpdated(Date.now());
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
  };

  usePolling(fetchPulse, POLL_INTERVAL_MS, { enabled: Boolean(user) && autoRefresh, deps: [user, filters.theater, autoRefresh] });

  const handleRefreshNow = () => {
    setLoading(true);
    fetchPulse(() => false);
  };

  const movies = useMemo(() => [...new Set(shows.map((s) => s.title).filter(Boolean))].sort(), [shows]);
  const screens = useMemo(() => [...new Set(shows.map((s) => s.screenName).filter(Boolean))].sort(), [shows]);

  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!s.title?.toLowerCase().includes(q) && !s.screenName?.toLowerCase().includes(q)) return false;
      }
      if (filters.movie !== "all" && s.title !== filters.movie) return false;
      if (filters.screen !== "all" && s.screenName !== filters.screen) return false;
      if (filters.occupancy !== "all" && occupancyTier(s.occupancyPct).tier !== filters.occupancy) return false;
      if (filters.status !== "all" && getLiveStatus(s, now) !== filters.status) return false;
      if (filters.time !== "all") {
        const hoursToStart = (new Date(s.showDateTime).getTime() - now) / 3600000;
        const limit = filters.time === "next-2h" ? 2 : filters.time === "next-6h" ? 6 : 24;
        if (hoursToStart > limit) return false;
      }
      return true;
    });
  }, [shows, filters, now]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleViewSeats = () => navigate(`/admin/list-shows`);
  const handleOpenShow = (show) => navigate(`/movies/${show._id}`);
  const handleAnalytics = () => navigate("/admin/dashboard");
  const handleNotifyStaff = (show) => toast.success(`Staff notified for ${show.title} at ${show.screenName}`);

  const handleExport = () => {
    const rows = [
      ["Movie", "Screen", "Theater", "Show Time", "Occupied", "Capacity", "Occupancy %", "Revenue"],
      ...filteredShows.map((s) => [s.title, s.screenName, s.theaterName || "", s.showDateTime, s.occupiedCount, s.totalCapacity ?? "", s.occupancyPct ?? "", Math.round(s.revenue || 0)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multiplex-pulse-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => toast.error("Fullscreen not supported"));
    } else {
      document.exitFullscreen?.();
    }
  };

  if (loading) return <Loading />;

  return (
    <div ref={containerRef} className="space-y-5 pb-10 bg-void">
      <OperationsCenterHeader
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
        onRefreshNow={handleRefreshNow}
        onExport={handleExport}
        onFullscreen={handleFullscreen}
      />

      <LiveStatusBar lastUpdated={lastUpdated} intervalMs={POLL_INTERVAL_MS} />

      <PulseKpiRow shows={shows} currency={currency} now={now} />

      <PulseFilterBar
        filters={filters}
        setFilters={setFilters}
        theaters={theaters}
        movies={movies}
        screens={screens}
        adminRole={adminRole}
        onReset={resetFilters}
        resultCount={filteredShows.length}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5">
          {filteredShows.length === 0 ? (
            <div className="glass-panel !rounded-3xl py-16 text-center text-sm text-gray-500">
              No shows match the current filters in the next 24 hours.
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredShows.map((show, i) => (
                  <LiveShowCard
                    key={show._id}
                    show={show}
                    i={i}
                    currency={currency}
                    imageBaseUrl={image_base_url}
                    now={now}
                    onViewSeats={handleViewSeats}
                    onOpenShow={handleOpenShow}
                    onAnalytics={handleAnalytics}
                    onNotifyStaff={handleNotifyStaff}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <OccupancyHeatmap shows={shows} />
          <TheaterScreenGrid shows={shows} />
          <UpcomingTimeline shows={[...shows].sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime)).slice(0, 10)} />
        </div>

        <div className="space-y-4">
          <LiveActivitySidebar events={activityEvents} />
          <OperationsAIAlerts shows={shows} now={now} />
        </div>
      </div>
    </div>
  );
};

export default MultiplexPulse;
