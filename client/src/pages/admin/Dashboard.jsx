import React, { useState, useCallback, useRef, useMemo } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, UsersIcon, DownloadIcon } from "lucide-react";
import Loading from "../../components/Loading";
import InlineSpinner from "../../components/admin/InlineSpinner";
import { useAppContext } from "../../context/useAppContext";
import useFetchOnUser from "../../hooks/useFetchOnUser";
import useCsvExport from "../../hooks/useCsvExport";
import toast from "react-hot-toast";
import DateRangePicker from "../../components/admin/DateRangePicker";
import RevenueTrendChart from "../../components/admin/RevenueTrendChart";
import OccupancyChart from "../../components/admin/OccupancyChart";
import TopMoviesChart from "../../components/admin/TopMoviesChart";
import TopTheatersChart from "../../components/admin/TopTheatersChart";
import GenreDistributionChart from "../../components/admin/GenreDistributionChart";
import CommunityRevenueTable from "../../components/admin/CommunityRevenueTable";
import { defaultDateRange } from "../../lib/dateRange";
import DashboardHero from "../../components/admin/dashboard/DashboardHero";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import AIInsightsPanel from "../../components/admin/dashboard/AIInsightsPanel";
import LiveActivityFeed from "../../components/admin/dashboard/LiveActivityFeed";
import ActiveShowCard from "../../components/admin/dashboard/ActiveShowCard";
import FloatingQuickActions from "../../components/admin/dashboard/FloatingQuickActions";

const Dashboard = () => {
  const { axios, user, image_base_url, fetchTheaters } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    todayRevenue: 0,
    yesterdayBookings: 0,
    yesterdayRevenue: 0,
    activeShowsCount: 0,
    activeShows: [],
    totalUser: 0,
  });
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState(defaultDateRange);
  const [theaters, setTheaters] = useState([]);
  const [theaterId, setTheaterId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const { exporting, exportCsv } = useCsvExport(
    "/api/admin/export-bookings",
    () => `bookings-${range.from}-to-${range.to}.csv`
  );

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

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard-data");
      if (data.success) {
        setDashboardData(data.dashboardData);
        setLoading(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error(error);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await axios.get("/api/admin/dashboard-analytics", {
        params: { from: range.from, to: range.to, ...(theaterId ? { theaterId } : {}) },
      });
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch analytics data");
      console.error(error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [axios, range.from, range.to, theaterId]);

  useFetchOnUser(user, fetchDashboardData);
  useFetchOnUser(user, fetchAnalytics, [fetchAnalytics]);
  useFetchOnUser(user, () => fetchTheaters().then(setTheaters));

  const handleExportCsv = () =>
    exportCsv({ from: range.from, to: range.to, ...(theaterId ? { theaterId } : {}) });

  const bookingsChangePct = dashboardData.yesterdayBookings > 0
    ? ((dashboardData.todayBookings - dashboardData.yesterdayBookings) / dashboardData.yesterdayBookings) * 100
    : null;
  const revenueChangePct = dashboardData.yesterdayRevenue > 0
    ? ((dashboardData.todayRevenue - dashboardData.yesterdayRevenue) / dashboardData.yesterdayRevenue) * 100
    : null;

  const revenueSparkline = useMemo(() => analytics?.revenueTrend?.slice(-14) || null, [analytics]);

  if (loading) return <Loading />;

  return (
    <div ref={rootRef} onMouseMove={handlePointerMove} className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -left-10 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, rgba(109,92,255,0.5), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-20 w-[28rem] h-[28rem] rounded-full blur-[120px] opacity-15"
          style={{ background: "radial-gradient(circle, rgba(63,216,224,0.45), transparent 70%)" }}
        />
        <div className="noise-overlay absolute inset-0" />
        <motion.div className="absolute inset-0" style={{ background: spotlightBg }} />
      </div>

      <DashboardHero />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={ChartLineIcon}
          label="Bookings Today"
          value={dashboardData.todayBookings}
          changePct={bookingsChangePct}
          i={0}
        />
        <KpiCard
          icon={CircleDollarSignIcon}
          label="Revenue Today"
          value={dashboardData.todayRevenue}
          prefix={currency}
          changePct={revenueChangePct}
          sparklineData={revenueSparkline}
          sparklineKey="revenue"
          i={1}
          tone="violet"
        />
        <KpiCard icon={PlayCircleIcon} label="Active Shows" value={dashboardData.activeShowsCount} i={2} />
        <KpiCard icon={UsersIcon} label="Total Users" value={dashboardData.totalUser || 0} i={3} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <AIInsightsPanel dashboardData={dashboardData} analytics={analytics} currency={currency} />
        <LiveActivityFeed />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className="section-eyebrow mb-1">Analytics</p>
          <p className="text-lg font-display font-medium">Performance Breakdown</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {theaters.length > 0 && (
            <label className="flex flex-col text-xs text-gray-400 gap-1.5">
              Theater
              <select
                value={theaterId}
                onChange={(e) => setTheaterId(e.target.value)}
                className="glass-input !rounded-xl text-sm py-2"
              >
                <option value="" className="bg-[#1a1a1c] text-white">All theaters</option>
                {theaters.map((t) => (
                  <option key={t._id} value={t._id} className="bg-[#1a1a1c] text-white">
                    {t.name} · {t.city}
                  </option>
                ))}
              </select>
            </label>
          )}
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={({ from, to }) => setRange((prev) => ({ from: from || prev.from, to: to || prev.to }))}
          />
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 btn-glow rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer border border-white/10"
          >
            <DownloadIcon className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </motion.button>
        </div>
      </div>

      {analyticsLoading ? (
        <InlineSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
          <div className="glass-panel p-5">
            <p className="font-medium mb-3 text-sm">Revenue Trend</p>
            <RevenueTrendChart data={analytics?.revenueTrend} currency={currency} />
          </div>
          <div className="glass-panel p-5">
            <p className="font-medium mb-3 text-sm">Top Movies by Revenue</p>
            <TopMoviesChart data={analytics?.topMovies} currency={currency} />
          </div>
          <div className="glass-panel p-5">
            <p className="font-medium mb-3 text-sm">Occupancy by Show</p>
            <OccupancyChart data={analytics?.occupancyByShow} />
          </div>
          <div className="glass-panel p-5">
            <p className="font-medium mb-3 text-sm">Genre Distribution</p>
            <GenreDistributionChart data={analytics?.genreDistribution} currency={currency} />
          </div>
          {analytics?.topTheaters?.length > 0 && (
            <div className="glass-panel p-5 lg:col-span-2">
              <p className="font-medium mb-3 text-sm">Top Theaters by Revenue</p>
              <TopTheatersChart data={analytics.topTheaters} currency={currency} />
            </div>
          )}
          {analytics?.communityRevenue?.length > 0 && (
            <div className="glass-panel p-5 lg:col-span-2">
              <p className="font-medium mb-3 text-sm">Community &amp; Indie Screening Revenue</p>
              <CommunityRevenueTable data={analytics.communityRevenue} currency={currency} />
            </div>
          )}
        </div>
      )}

      <p className="section-eyebrow mb-1">Right Now</p>
      <p className="text-lg font-display font-medium mb-5">Active Shows</p>

      {dashboardData.activeShows.length === 0 ? (
        <p className="text-sm text-gray-400">No shows scheduled for today.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
          {dashboardData.activeShows.map((show, i) => (
            <ActiveShowCard key={show._id} show={show} imageBaseUrl={image_base_url} currency={currency} i={i} />
          ))}
        </div>
      )}

      <FloatingQuickActions />
    </div>
  );
};

export default Dashboard;
