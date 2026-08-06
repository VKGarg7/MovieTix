import React, { useState } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, DownloadIcon } from "lucide-react";
import PageHeader from "../components/cinematic/PageHeader";
import MovieCarousel from "../components/cinematic/MovieCarousel";
import EmptyState from "../components/admin/EmptyState";
import Loading from "../components/Loading";
import { INSIGHT_TONE_CLASSES } from "../lib/insightTones";
import timeFormat from "../lib/timeFormat";
import { downloadStatsCardImage } from "../lib/canvasShareImage";
import { useAppContext } from "../context/useAppContext";
import useFetchOnUser from "../hooks/useFetchOnUser";

const StatCard = ({ tone = "primary", label, value, sub }) => (
  <div className={`glass-panel w-72 shrink-0 p-6 border ${INSIGHT_TONE_CLASSES[tone]}`}>
    <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">{label}</p>
    <p className="text-3xl font-display font-medium mb-1">{value}</p>
    {sub && <p className="text-sm text-gray-400">{sub}</p>}
  </div>
);

const Wrapped = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [wrapped, setWrapped] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWrapped = async () => {
    try {
      const { data } = await axios.get("/api/user/wrapped", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setWrapped(data);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useFetchOnUser(user, fetchWrapped);

  const handleDownload = () => {
    if (!wrapped) return;
    downloadStatsCardImage({
      title: "Your Year in Movies",
      subtitle: "MovieTix Wrapped",
      filename: "movietix-wrapped.png",
      lines: [
        { label: "Movies watched", value: wrapped.totalBookings },
        { label: "Total spent", value: `${currency}${wrapped.totalSpent}` },
        { label: "Favorite genre", value: wrapped.favoriteGenre || "—" },
        { label: "Most-visited theater", value: wrapped.mostVisitedTheater?.name || "—" },
        { label: "Favorite row", value: wrapped.favoriteRow || "—" },
        { label: "Longest movie sat through", value: wrapped.longestMovie?.title || "—" },
        { label: "Spend percentile", value: `Top ${100 - wrapped.spendPercentile}%` },
      ],
    });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <PageHeader eyebrow="Your Account" title="MovieTix Wrapped" />

      {!wrapped?.hasEnoughHistory ? (
        <EmptyState
          icon={SparklesIcon}
          tone="violet"
          title="Your Wrapped isn't ready yet"
          description="Book and watch a couple more movies with us, and we'll put together your personal year-in-review recap."
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <MovieCarousel>
              <StatCard tone="primary" label="Movies watched" value={wrapped.totalBookings} sub={`${wrapped.totalSeats} tickets booked`} />
              <StatCard tone="amber" label="Total spent" value={`${currency}${wrapped.totalSpent}`} />
              <StatCard tone="cyan" label="Favorite genre" value={wrapped.favoriteGenre || "—"} />
              <StatCard
                tone="violet"
                label="Most-visited theater"
                value={wrapped.mostVisitedTheater?.name || "—"}
                sub={wrapped.mostVisitedTheater ? `${wrapped.mostVisitedTheater.visits} visits` : undefined}
              />
              <StatCard tone="primary" label="Favorite row" value={wrapped.favoriteRow ? `Row ${wrapped.favoriteRow}` : "—"} />
              <StatCard
                tone="amber"
                label="Longest movie sat through"
                value={wrapped.longestMovie?.title || "—"}
                sub={wrapped.longestMovie ? timeFormat(wrapped.longestMovie.runtime) : undefined}
              />
              <StatCard
                tone="cyan"
                label="Popcorn-tier bragging rights"
                value={`Top ${100 - wrapped.spendPercentile}%`}
                sub="of spenders this year"
              />
            </MovieCarousel>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-white cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            Download as image
          </motion.button>
        </>
      )}
    </div>
  );
};

export default Wrapped;
