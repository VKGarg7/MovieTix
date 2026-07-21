import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  StarIcon,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { dummyDashboardData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { UsersIcon } from "lucide-react";
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const Dashboard = () => {

  const {axios , getToken , user , image_base_url} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
  });
  const [loading, setLoading] = useState(true);

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
      value: dashboardData.activeShows.length || "0",
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
      const {data} = await axios.get("/api/admin/dashboard-data", {
        headers: { Authorization: `Bearer ${await getToken()}`}})

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


  useEffect(() => {
    if(user){
      fetchDashboardData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0px" />

        <div className="flex flex-wrap gap-4 w-full">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="card-surface flex items-center justify-between px-5 py-4 rounded-xl max-w-50 w-full hover:border-white/20 transition-colors duration-300">

              <div>
                <h1 className="text-xs text-gray-400 tracking-wide">{card.title}</h1>
                <p className="text-2xl font-semibold mt-1.5 tracking-tight">{card.value}</p>
              </div>

              <card.icon className="w-6 h-6 text-primary" />
            </div>
          ))}
        </div>

      </div>

      <p className="mt-12 text-xl font-semibold tracking-tight">Active Shows</p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="-100px" left="-10%" />
        {dashboardData.activeShows.map((show)=>(
          <div key={show._id} className="card-surface w-55 rounded-xl overflow-hidden h-full pb-3 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
            <img src={image_base_url + show.movie.poster_path} alt="" className="h-60 w-full object-cover"/>
            <p className="font-medium p-2.5 truncate">{show.movie.title}</p>

            <div className="flex items-center justify-between px-2.5">
              <p className="text-lg font-semibold">{currency}{show.showPrice}</p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary"/>
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>

            <p className="px-2.5 pt-2 text-sm text-gray-500">{dateFormat(show.showDateTime)}</p>

          </div>
        ))}
      </div>

    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;
