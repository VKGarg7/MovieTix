import {
  ChartLineIcon,
  CircleDollarSignIcon,
  DownloadIcon,
  PlayCircleIcon,
  StarIcon,
} from "lucide-react";
import React, { useState, useCallback } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import InlineSpinner from "../../components/admin/InlineSpinner";
import { UsersIcon } from "lucide-react";
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from "../../context/useAppContext";
import useFetchOnUser from "../../hooks/useFetchOnUser";
import useCsvExport from "../../hooks/useCsvExport";
import toast from "react-hot-toast";
import DateRangePicker from "../../components/admin/DateRangePicker";
import RevenueTrendChart from "../../components/admin/RevenueTrendChart";
import OccupancyChart from "../../components/admin/OccupancyChart";
import TopMoviesChart from "../../components/admin/TopMoviesChart";
import { defaultDateRange } from "../../lib/dateRange";

const Dashboard = () => {

  const {axios , user , image_base_url, fetchTheaters} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
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

  const dashboardCards = [
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings || "0",
      icon: ChartLineIcon,
    },
    {
      title: "Total Revenue",
      value: currency + dashboardData.totalRevenue || "0",
      icon: CircleDollarSignIcon,
    },
    {
      title: "Active Shows",
      value: dashboardData.activeShowsCount || "0",
      icon: PlayCircleIcon,
    },
    {
      title: "Total Users",
      value: dashboardData.totalUser || "0 ", 
      icon: UsersIcon,
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const {data} = await axios.get("/api/admin/dashboard-data");

        if(data.success){
          setDashboardData(data.dashboardData)
          setLoading(false)
        }else{
          toast.error(data.message)
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
        params: {
          from: range.from,
          to: range.to,
          ...(theaterId ? { theaterId } : {}),
        },
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

  const handleExportCsv = () => exportCsv({
    from: range.from,
    to: range.to,
    ...(theaterId ? { theaterId } : {}),
  });

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0px" />

        <div className="flex flex-wrap gap-4 w-full">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full">

              <div>
                <h1 className="text-sm">{card.title}</h1>
                <p className="text-xl font-medium mt-1">{card.value}</p>
              </div>
              
              <card.icon className="w-6 h-6" />
            </div>
          ))}
        </div>

      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mt-10">
        <p className="text-lg font-medium">Analytics</p>
        <div className="flex flex-wrap items-end gap-3">
          {theaters.length > 0 && (
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
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={({ from, to }) => setRange((prev) => ({ from: from || prev.from, to: to || prev.to }))}
          />
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium disabled:opacity-50"
          >
            <DownloadIcon className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {analyticsLoading ? (
        <InlineSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
            <p className="font-medium mb-2">Revenue Trend</p>
            <RevenueTrendChart data={analytics?.revenueTrend} currency={currency} />
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
            <p className="font-medium mb-2">Top Movies by Revenue</p>
            <TopMoviesChart data={analytics?.topMovies} currency={currency} />
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4 lg:col-span-2">
            <p className="font-medium mb-2">Occupancy by Show</p>
            <OccupancyChart data={analytics?.occupancyByShow} />
          </div>
        </div>
      )}

      <p className="mt-10 text-lg font-medium">Active Shows</p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="-100px" left="-10%" />
        {dashboardData.activeShows.map((show)=>(
          <div key={show._id} className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300">
            <img src={image_base_url + show.movie.poster_path} alt="" className="h-60 w-full object-cover"/>
            <p className="font-medium p-2 truncate">{show.movie.title}</p>

            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">{currency}{show.showPrice}</p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary"/>
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>

            <p className="px-2 pt-2 text-sm text-gray-500">{dateFormat(show.showDateTime)}</p>

          </div>
        ))}
      </div>

    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;
