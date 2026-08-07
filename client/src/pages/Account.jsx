import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/useAppContext";
import useFetchOnUser from "../hooks/useFetchOnUser";
import AccountSidebar from "../components/account/AccountSidebar";
import OverviewTab from "../components/account/OverviewTab";
import BookingsTab from "../components/account/BookingsTab";
import WishlistTab from "../components/account/WishlistTab";
import RewardsTab from "../components/account/RewardsTab";
import PassportTab from "../components/account/PassportTab";
import SecurityTab from "../components/account/SecurityTab";
import Loading from "../components/Loading";

const Account = () => {
  const { user, isLoaded } = useUser();
  const { axios, getToken, favoriteMovies } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const VALID_TABS = ["overview", "bookings", "wishlist", "rewards", "passport", "security"];
  const initialTab = VALID_TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(tab === "overview" ? {} : { tab }, { replace: true });
  };
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);

  const rootRef = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 60, damping: 24 });
  const smy = useSpring(my, { stiffness: 60, damping: 24 });
  const spotlightX = useTransform(smx, (v) => `${v * 100}%`);
  const spotlightY = useTransform(smy, (v) => `${v * 100}%`);
  const spotlightBg = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) => `radial-gradient(500px circle at ${x} ${y}, rgba(255,255,255,0.04), transparent 70%)`
  );

  const loadDashboardData = async () => {
    setBookingsLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [allRes, upcomingRes, pointsRes] = await Promise.all([
        axios.get("/api/user/bookings", { params: { page: 1, limit: 6 }, headers }),
        axios.get("/api/user/bookings", { params: { category: "Upcoming", page: 1, limit: 1 }, headers }),
        axios.get("/api/user/points", { headers }),
      ]);
      setBookings(allRes.data?.bookings || []);
      setTotalBookings(allRes.data?.pageInfo?.total || 0);
      setUpcomingCount(upcomingRes.data?.pageInfo?.total || 0);
      setPointsBalance(pointsRes.data?.balance || 0);
    } catch (error) {
      console.error("Failed to load account dashboard data:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  useFetchOnUser(user, loadDashboardData);

  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  if (!isLoaded) return <Loading />;

  const stats = { totalBookings, wishlist: favoriteMovies.length, points: pointsBalance };

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointerMove}
      className="relative pt-32 pb-32 px-6 md:px-10 lg:px-16 xl:px-24 min-h-screen overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-void via-[#0a0a10] to-void" />
        <div
          className="absolute top-0 left-0 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30"
          style={{ background: "radial-gradient(circle, rgba(109,92,255,0.4), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(63,216,224,0.35), transparent 70%)" }}
        />
        <motion.div className="absolute inset-0 opacity-50" style={{ background: spotlightBg }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <p className="section-eyebrow mb-2">Your Account</p>
        <h1 className="text-3xl md:text-4xl font-display font-medium">Dashboard</h1>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <AccountSidebar active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "overview" && <OverviewTab stats={stats} upcomingCount={upcomingCount} />}
              {activeTab === "bookings" && <BookingsTab bookings={bookings} loading={bookingsLoading} />}
              {activeTab === "wishlist" && <WishlistTab favoriteMovies={favoriteMovies} />}
              {activeTab === "rewards" && <RewardsTab pointsBalance={pointsBalance} />}
              {activeTab === "passport" && <PassportTab />}
              {activeTab === "security" && <SecurityTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Account;
