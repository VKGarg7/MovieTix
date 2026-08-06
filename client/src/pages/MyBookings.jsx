import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import {
  EyeOffIcon,
  XIcon,
  TicketIcon,
  HistoryIcon,
  GiftIcon,
  UsersIcon,
  ClockIcon,
  SparklesIcon,
  FilmIcon,
  WalletIcon,
  CalendarDaysIcon,
  MapPinIcon,
  QrCodeIcon,
  CopyIcon,
  Share2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompassIcon,
  CrownIcon,
} from "lucide-react";
import Loading from "../components/Loading";
import PageHeader from "../components/cinematic/PageHeader";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useFetchOnUser from "../hooks/useFetchOnUser";
import useScrollToHash from "../hooks/useScrollToHash";
import BingePass from "../components/BingePass";

const CANCELLATION_CUTOFF_HOURS = 2;
const TABS = ["Upcoming", "Completed", "Cancelled"];

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 1500 },
  { name: "Platinum", min: 3500 },
];

const getTierInfo = (points) => {
  let current = TIERS[0];
  let next = TIERS[1];
  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] || null;
    }
  }
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(100, ((points - current.min) / span) * 100) : 100;
  return { current, next, progress, toNext: next ? next.min - points : 0 };
};

const formatCountdown = (ms) => {
  if (ms <= 0) return "Starting now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const Countdown = ({ showDateTime }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = new Date(showDateTime).getTime() - now;

  return (
    <div className="flex items-center gap-1.5">
      <ClockIcon className="w-3.5 h-3.5 text-primary" />
      <p className="text-sm font-medium text-primary">
        {remainingMs <= 0 ? "Starting now" : `Starts in ${formatCountdown(remainingMs)}`}
      </p>
    </div>
  );
};

const formatClaimCountdown = (ms) => {
  if (ms <= 0) return "Offer expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s left to claim`;
};

const ClaimCountdown = ({ offerExpiresAt }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = new Date(offerExpiresAt).getTime() - now;

  return <span>{formatClaimCountdown(remainingMs)}</span>;
};

const CountUp = ({ value, prefix = "", decimals = 0 }) => {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {prefix}
      {Number(display).toLocaleString()}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, prefix, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -6 }}
    className="glass-panel glass-panel-hover relative overflow-hidden p-5"
  >
    <div
      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: "radial-gradient(circle at 30% 0%, rgba(248,69,101,0.12), transparent 60%)" }}
    />
    <div className="relative z-10 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-display font-medium">
          <CountUp value={value} prefix={prefix} />
        </p>
      </div>
    </div>
  </motion.div>
);

const StatusPill = ({ status }) => {
  const map = {
    Upcoming: "bg-primary/15 text-primary border-primary/30",
    Completed: "bg-nebula-cyan/15 text-nebula-cyan border-nebula-cyan/30",
    Cancelled: "bg-white/10 text-gray-400 border-white/15",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${map[status] || map.Upcoming}`}>
      {status}
    </span>
  );
};

const MyBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState({ Upcoming: 0, Completed: 0, Cancelled: 0 });
  const [qrModalUrl, setQrModalUrl] = useState(null);
  const [loadingQrId, setLoadingQrId] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [groupBookings, setGroupBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [leavingWaitlistShowId, setLeavingWaitlistShowId] = useState(null);
  const [lifetimeStats, setLifetimeStats] = useState({ ticketsBooked: 0, moneySaved: 0, completedCount: 0 });

  const getMyBookings = async (category, targetPage) => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        params: { category, page: targetPage },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings);
        setTotalPages(data.pageInfo?.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const refreshTabCounts = async () => {
    try {
      const token = await getToken();
      const results = await Promise.all(
        TABS.map((tab) =>
          axios.get("/api/user/bookings", {
            params: { category: tab, page: 1, limit: 1 },
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const counts = {
        Upcoming: results[0].data.pageInfo?.total || 0,
        Completed: results[1].data.pageInfo?.total || 0,
        Cancelled: results[2].data.pageInfo?.total || 0,
      };
      setTabCounts(counts);
      setLifetimeStats((prev) => ({
        ...prev,
        ticketsBooked: counts.Upcoming + counts.Completed + counts.Cancelled,
        completedCount: counts.Completed,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  useFetchOnUser(user, () => getMyBookings(activeTab, page), [activeTab, page]);
  useFetchOnUser(user, refreshTabCounts);

  const getPointsBalance = async () => {
    try {
      const { data } = await axios.get("/api/user/points", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setPointsBalance(data.balance);
    } catch (error) {
      console.log(error);
    }
  };

  const togglePointsHistory = async () => {
    if (showPointsHistory) {
      setShowPointsHistory(false);
      return;
    }
    try {
      const { data } = await axios.get("/api/user/points/history", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setPointsHistory(data.transactions);
        setShowPointsHistory(true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load points history");
    }
  };

  useFetchOnUser(user, getPointsBalance);

  const getReferralInfo = async () => {
    try {
      const { data } = await axios.get("/api/user/referral", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setReferralCode(data.referralCode);
        setReferralCount(data.referralCount);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useFetchOnUser(user, getReferralInfo);

  const getMyGroupBookings = async () => {
    try {
      const { data } = await axios.get("/api/group-booking/mine", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setGroupBookings(data.groupBookings);
    } catch (error) {
      console.log(error);
    }
  };

  useFetchOnUser(user, getMyGroupBookings);
  useScrollToHash(location.hash, "#watch-parties", groupBookings.length > 0);

  const getMyWaitlist = async () => {
    try {
      const { data } = await axios.get("/api/waitlist/mine", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setWaitlistEntries(data.waitlistEntries);
    } catch (error) {
      console.log(error);
    }
  };

  useFetchOnUser(user, getMyWaitlist);
  useScrollToHash(location.hash, "#waitlist", waitlistEntries.length > 0);

  const leaveWaitlist = async (showId) => {
    setLeavingWaitlistShowId(showId);
    try {
      const { data } = await axios.post(
        `/api/waitlist/${showId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Left the waitlist");
        getMyWaitlist();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave waitlist");
    }
    setLeavingWaitlistShowId(null);
  };

  // Accumulate money-saved (points discounts) from whatever booking pages we've loaded.
  useEffect(() => {
    const savedFromPage = bookings.reduce((sum, b) => sum + (b.pointsDiscountAmount || 0), 0);
    setLifetimeStats((prev) => ({ ...prev, moneySaved: Math.max(prev.moneySaved, savedFromPage) }));
  }, [bookings]);

  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on MovieTix", url: referralLink });
      } catch {
        /* user cancelled share sheet */
      }
    } else {
      copyReferralLink();
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const canCancel = (item) =>
    item.isPaid &&
    item.status !== "cancelled" &&
    item.status !== "pending-cancellation" &&
    item.show?.showDateTime &&
    new Date(item.show.showDateTime).getTime() - Date.now() >
      CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      const { data } = await axios.post(
        `/api/booking/cancel/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || "Booking cancelled");
        getMyBookings(activeTab, page);
        refreshTabCounts();
        getPointsBalance();
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel booking");
    }
    setCancellingId(null);
  };

  const handleAddToCalendar = async (item) => {
    setDownloadingId(item._id);
    try {
      const response = await axios.get(`/api/booking/calendar/${item._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/calendar" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.show?.movie?.title || "booking"}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to generate calendar event");
    }
    setDownloadingId(null);
  };

  const handleShowQr = async (bookingId) => {
    setLoadingQrId(bookingId);
    try {
      const response = await axios.get(`/api/booking/pickup-qr/${bookingId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "image/png" }));
      setQrModalUrl(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load pickup QR code");
    }
    setLoadingQrId(null);
  };

  const closeQrModal = () => {
    if (qrModalUrl) window.URL.revokeObjectURL(qrModalUrl);
    setQrModalUrl(null);
  };

  const tier = useMemo(() => getTierInfo(pointsBalance), [pointsBalance]);
  const firstName = user?.firstName || user?.fullName?.split(" ")?.[0] || "there";

  const emptyStateCopy = {
    Upcoming: { title: "No upcoming bookings", subtitle: "Your next movie night is just a click away." },
    Completed: { title: "You haven't watched any movies yet.", subtitle: "Book a show and it'll show up here once it's done." },
    Cancelled: { title: "No cancelled bookings.", subtitle: "Nothing here — that's a good thing." },
  };

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      {/* ============ HERO ACCOUNT SECTION ============ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <p className="section-eyebrow mb-3">Your Account</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-medium mb-2">My Bookings</h1>
            <p className="text-gray-400 font-light max-w-lg">
              Welcome back, <span className="text-white font-medium">{firstName}</span> 👋
              <br />
              Track upcoming movies, manage your membership, view tickets, loyalty rewards and watch parties.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[380px]">
            <motion.div whileHover={{ y: -4 }} className="glass-panel glass-panel-hover p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <CrownIcon className="w-3.5 h-3.5 text-nebula-amber" /> Membership
              </div>
              <p className="text-sm font-medium">Binge Pass</p>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="glass-panel glass-panel-hover p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <SparklesIcon className="w-3.5 h-3.5 text-nebula-violet" /> Loyalty Tier
              </div>
              <p className="text-sm font-medium">{tier.current.name} Member</p>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="glass-panel glass-panel-hover p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <TicketIcon className="w-3.5 h-3.5 text-primary" /> Tickets Booked
              </div>
              <p className="text-sm font-medium">{lifetimeStats.ticketsBooked}</p>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="glass-panel glass-panel-hover p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <WalletIcon className="w-3.5 h-3.5 text-nebula-cyan" /> Lifetime Savings
              </div>
              <p className="text-sm font-medium">{currency}{lifetimeStats.moneySaved.toLocaleString()}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ============ ACCOUNT STATS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TicketIcon} label="Tickets Booked" value={lifetimeStats.ticketsBooked} delay={0.05} />
        <StatCard icon={FilmIcon} label="Movies Watched" value={lifetimeStats.completedCount} delay={0.1} />
        <StatCard icon={SparklesIcon} label="Reward Points" value={pointsBalance} delay={0.15} />
        <StatCard icon={WalletIcon} label="Money Saved" value={lifetimeStats.moneySaved} prefix={currency} delay={0.2} />
      </div>

      {/* ============ BINGE PASS ============ */}
      <BingePass />

      {/* ============ LOYALTY CARD ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="relative glass-panel glass-panel-hover mb-6 p-5 max-w-3xl overflow-hidden"
      >
        <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #6D5CFF, transparent 70%)" }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#tierGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - tier.progress / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F84565" />
                  <stop offset="100%" stopColor="#FFB86B" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-nebula-amber" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-display font-medium">{tier.current.name} Member</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-nebula-violet/15 text-nebula-violet border border-nebula-violet/30">
                LOYALTY
              </span>
            </div>
            <p className="text-2xl font-semibold text-primary mb-1">
              <CountUp value={pointsBalance} /> <span className="text-sm text-gray-400 font-normal">points</span>
            </p>
            <p className="text-xs text-gray-400">
              {tier.next ? `${tier.toNext.toLocaleString()} points until ${tier.next.name}` : "You've reached the top tier"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden max-w-xs">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-nebula-amber"
                initial={{ width: 0 }}
                animate={{ width: `${tier.progress}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          <div className="flex md:flex-col gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/movies")}
              className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer whitespace-nowrap"
            >
              Redeem Rewards
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={togglePointsHistory}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium border border-white/15 rounded-full cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              {showPointsHistory ? "Hide History" : "History"}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showPointsHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 overflow-hidden mt-4"
            >
              {pointsHistory.length === 0 ? (
                <p className="text-gray-400 text-sm">No points activity yet.</p>
              ) : (
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {pointsHistory.map((tx) => (
                        <tr key={tx._id} className="border-b border-white/5 last:border-0">
                          <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 capitalize">{tx.reason.replace(/_/g, " ")}</td>
                          <td className={`p-3 text-right font-medium ${tx.delta > 0 ? "text-green-400" : "text-red-400"}`}>
                            {tx.delta > 0 ? "+" : ""}
                            {tx.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ============ REFERRAL SECTION ============ */}
      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative glass-panel glass-panel-hover mb-6 p-5 max-w-3xl overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #3FD8E0, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <GiftIcon className="w-4 h-4 text-nebula-cyan" />
              <p className="text-base font-display font-medium">Invite Friends</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 mb-4 font-light">
              Earn <span className="text-white font-medium">₹200</span> for every successful referral.
              {referralCount > 0 && ` You've referred ${referralCount} friend${referralCount > 1 ? "s" : ""} so far.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 glass-input !rounded-2xl">
                <span className="text-xs text-gray-400 shrink-0">Code</span>
                <span className="font-mono text-sm truncate">{referralCode}</span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={copyReferralLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer whitespace-nowrap"
                >
                  <CopyIcon className="w-3.5 h-3.5" /> Copy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={shareReferralLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-white/15 rounded-full cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  <Share2Icon className="w-3.5 h-3.5" /> Share
                </motion.button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Join me on MovieTix! ${referralLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs rounded-full border border-white/15 hover:bg-white/5 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on MovieTix!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs rounded-full border border-white/15 hover:bg-white/5 transition-colors"
              >
                Telegram
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent("Join me on MovieTix")}&body=${encodeURIComponent(referralLink)}`}
                className="px-3.5 py-1.5 text-xs rounded-full border border-white/15 hover:bg-white/5 transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============ WATCH PARTIES ============ */}
      {groupBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="watch-parties"
          className="mb-8 scroll-mt-24"
        >
          <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-primary" /> My Watch Parties
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupBookings.map((group) => (
              <motion.div key={group.groupId} whileHover={{ y: -6 }} className="glass-panel glass-panel-hover overflow-hidden flex flex-col">
                <div className="h-24 bg-gradient-to-br from-nebula-violet/30 via-primary/20 to-void flex items-center justify-center">
                  <UsersIcon className="w-8 h-8 text-white/50" />
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium font-display text-base">
                      {group.show?.movieTitle || "Show no longer available"}
                    </p>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        group.status === "active" || group.status === "open"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-white/10 text-gray-400 border-white/15"
                      }`}
                    >
                      {group.status?.toUpperCase()}
                    </span>
                  </div>
                  {group.show?.showDateTime && (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <CalendarDaysIcon className="w-3.5 h-3.5" /> {dateFormat(group.show.showDateTime)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {group.claimedCount}/{group.totalSeats} joined &middot; {group.paidCount}/{group.totalSeats} paid
                  </p>
                  {group.show?.showDateTime && (
                    <p className="text-xs text-nebula-amber">
                      {formatCountdown(new Date(group.show.showDateTime).getTime() - Date.now())} to go
                    </p>
                  )}
                  <Link
                    to={`/group-booking/${group.groupId}/manage`}
                    className="mt-auto pt-2 text-center text-xs font-medium bg-primary hover:bg-primary-dull transition-colors rounded-full py-2 cursor-pointer"
                  >
                    Manage Party
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============ WAITLIST (unchanged functionality, refreshed styling) ============ */}
      {waitlistEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="waitlist"
          className="max-w-3xl mb-8 scroll-mt-24"
        >
          <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4 text-primary" /> My Waitlist
          </p>
          <div className="flex flex-col gap-2">
            {waitlistEntries.map((entry) => (
              <div key={entry.waitlistEntryId} className="flex items-center justify-between glass-panel glass-panel-hover px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{entry.show?.movieTitle || "Show no longer available"}</p>
                  {entry.show?.showDateTime && <p className="text-xs text-gray-400">{dateFormat(entry.show.showDateTime)}</p>}
                  {entry.status === "waiting" && <p className="text-xs text-gray-400 mt-1">Position #{entry.position} in line</p>}
                  {entry.status === "offered" && (
                    <p className="text-xs text-primary mt-1">
                      Seat {entry.offeredSeat} offered &mdash; <ClaimCountdown offerExpiresAt={entry.offerExpiresAt} />
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {entry.status === "offered" && (
                    <Link to={`/waitlist/${entry.waitlistEntryId}/claim`} className="px-3.5 py-1.5 text-xs bg-primary rounded-full font-medium">
                      Claim Now
                    </Link>
                  )}
                  <button
                    onClick={() => leaveWaitlist(entry.showId)}
                    disabled={leavingWaitlistShowId === entry.showId}
                    className="text-xs text-gray-400 hover:text-red-400 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============ BOOKING TABS ============ */}
      <div className="relative inline-flex items-center gap-1 p-1 mb-6 rounded-full bg-white/[0.04] border border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`relative px-5 py-2 text-sm font-medium rounded-full cursor-pointer transition-colors z-10 ${
              activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="mybookings-tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-dull -z-10"
              />
            )}
            <span className="relative">
              {tab} <span className="opacity-70">({tabCounts[tab]})</span>
            </span>
          </button>
        ))}
      </div>

      {/* ============ EMPTY STATES ============ */}
      {bookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel flex flex-col items-center justify-center text-center py-16 px-6 max-w-3xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            {activeTab === "Cancelled" ? (
              <XIcon className="w-7 h-7 text-gray-400" />
            ) : activeTab === "Completed" ? (
              <FilmIcon className="w-7 h-7 text-primary" />
            ) : (
              <TicketIcon className="w-7 h-7 text-primary" />
            )}
          </div>
          <p className="text-lg font-display font-medium mb-1">{emptyStateCopy[activeTab].title}</p>
          <p className="text-sm text-gray-400 font-light mb-5">{emptyStateCopy[activeTab].subtitle}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/movies")}
            className="px-6 py-2.5 text-sm font-medium bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer"
          >
            Browse Movies
          </motion.button>
        </motion.div>
      )}

      {/* ============ BOOKING CARDS ============ */}
      <AnimatePresence mode="popLayout">
        {bookings.map((item, index) => (
          <motion.div
            layout
            key={item._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel glass-panel-hover mt-4 max-w-3xl overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              {/* Poster */}
              <div className="md:w-44 shrink-0 p-3">
                {item.show?.movie ? (
                  item.show.movie.isMysteryMovie ? (
                    <div className="w-full aspect-video md:aspect-[3/4] bg-gradient-to-br from-primary/30 to-void rounded-2xl flex flex-col items-center justify-center gap-1">
                      <EyeOffIcon className="w-8 h-8 text-primary" />
                      <p className="text-xs">Mystery Movie</p>
                    </div>
                  ) : (
                    <img
                      src={image_base_url + item.show.movie.poster_path}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-video md:aspect-[3/4] object-cover object-top rounded-2xl"
                    />
                  )
                ) : (
                  <div className="w-full aspect-video md:aspect-[3/4] bg-white/5 rounded-2xl flex items-center justify-center">
                    <FilmIcon className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Middle — details */}
              <div className="flex-1 p-4 md:py-4 md:px-0 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-white/8 md:pl-5">
                {item.show?.movie ? (
                  <>
                    <p className="text-lg font-display font-medium">
                      {item.show.movie.isMysteryMovie ? "Mystery Movie" : item.show.movie.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.show.movie.isMysteryMovie
                        ? `${item.show.movie.genres?.map((g) => g.name).join(", ")} · ${item.show.movie.ratingBand}`
                        : timeFormat(item.show.movie.runtime)}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-medium text-gray-400">Show no longer available</p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5" /> MovieTix Multiplex
                  </span>
                  {item.show?.showDateTime && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDaysIcon className="w-3.5 h-3.5" /> {dateFormat(item.show.showDateTime)}
                    </span>
                  )}
                </div>

                <div className="h-px bg-white/8 my-1" />

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <div>
                    <p className="text-gray-500 mb-0.5">Seats</p>
                    <p className="font-medium">{item.bookedSeats.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Booking ID</p>
                    <p className="font-medium font-mono">#{item._id?.slice(-6).toUpperCase()}</p>
                  </div>
                  {item.snacks?.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-0.5">Snacks</p>
                      <p className="font-medium">{item.snacks.map((s) => `${s.quantity}x ${s.name}`).join(", ")}</p>
                    </div>
                  )}
                  {item.pointsRedeemed > 0 && (
                    <div>
                      <p className="text-gray-500 mb-0.5">Points redeemed</p>
                      <p className="font-medium">
                        {item.pointsRedeemed} (-{currency}
                        {item.pointsDiscountAmount})
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — price / status / actions */}
              <div className="md:w-56 shrink-0 flex flex-col md:items-end justify-between p-4 md:border-l border-t md:border-t-0 border-white/8 gap-3">
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2">
                  <p className="text-2xl font-semibold">
                    {currency}
                    {item.amount}
                  </p>
                  <StatusPill
                    status={
                      item.status === "cancelled" || item.status === "pending-cancellation"
                        ? "Cancelled"
                        : activeTab === "Completed"
                        ? "Completed"
                        : "Upcoming"
                    }
                  />
                </div>

                {activeTab === "Upcoming" && item.show?.showDateTime && <Countdown showDateTime={item.show.showDateTime} />}

                {item.status === "cancelled" && <p className="text-sm text-red-400">Refunded</p>}
                {item.status === "pending-cancellation" && <p className="text-sm text-yellow-500">Refund pending</p>}
                {activeTab === "Completed" && item.isPaid && item.status !== "cancelled" && (
                  <p className="text-xs text-nebula-cyan flex items-center gap-1">
                    <FilmIcon className="w-3.5 h-3.5" /> Watched
                  </p>
                )}

                <div className="flex flex-wrap md:flex-col gap-2 w-full">
                  {item.isPaid && item.status !== "cancelled" && item.status !== "pending-cancellation" && item.show?.movie && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAddToCalendar(item)}
                      disabled={downloadingId === item._id}
                      className="flex-1 md:flex-none border border-primary text-primary px-4 py-1.5 text-xs rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      {downloadingId === item._id ? "Preparing..." : "Add to Calendar"}
                    </motion.button>
                  )}

                  {item.isPaid && item.status !== "cancelled" && item.status !== "pending-cancellation" && item.snacks?.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleShowQr(item._id)}
                      disabled={loadingQrId === item._id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 border border-primary text-primary px-4 py-1.5 text-xs rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      <QrCodeIcon className="w-3.5 h-3.5" />
                      {loadingQrId === item._id ? "Loading..." : item.concessionPickedUp ? "Pickup QR (used)" : "Pickup QR"}
                    </motion.button>
                  )}

                  {!item.isPaid && item.status !== "cancelled" && (
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      href={item.paymentLink}
                      className="flex-1 md:flex-none text-center bg-primary px-4 py-1.5 text-xs rounded-full font-medium cursor-pointer whitespace-nowrap"
                    >
                      Pay Now
                    </motion.a>
                  )}

                  {canCancel(item) && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleCancel(item._id)}
                      disabled={cancellingId === item._id}
                      className="flex-1 md:flex-none border border-red-500 text-red-500 px-4 py-1.5 text-xs rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-red-500/10 transition-colors whitespace-nowrap"
                    >
                      {cancellingId === item._id ? "Cancelling..." : "Cancel"}
                    </motion.button>
                  )}

                  {activeTab === "Cancelled" && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate("/movies")}
                      className="flex-1 md:flex-none border border-white/15 px-4 py-1.5 text-xs rounded-full font-medium cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    >
                      Rebook
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center gap-4 mt-6 mb-6 max-w-3xl text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============ FLOATING QUICK ACTIONS ============ */}
      <div className="hidden xl:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-40">
        {[
          { icon: TicketIcon, label: "Book Tickets", to: "/movies" },
          { icon: CompassIcon, label: "Browse Movies", to: "/movies" },
          { icon: MapPinIcon, label: "Find Theaters", to: "/theaters" },
          { icon: GiftIcon, label: "Invite Friends", to: "#" },
          { icon: CrownIcon, label: "Membership", to: "#binge-pass" },
        ].map((action, i) => (
          <motion.a
            key={action.label}
            href={action.to.startsWith("#") ? action.to : undefined}
            onClick={action.to.startsWith("#") ? undefined : () => navigate(action.to)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileHover={{ scale: 1.08, x: -4 }}
            whileTap={{ scale: 0.94 }}
            className="group relative w-11 h-11 rounded-full glass-panel flex items-center justify-center cursor-pointer"
          >
            <action.icon className="w-4.5 h-4.5 text-primary" />
            <span className="absolute right-full mr-3 px-3 py-1.5 rounded-full bg-void-soft border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {action.label}
            </span>
          </motion.a>
        ))}
      </div>

      <AnimatePresence>
        {qrModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
            onClick={closeQrModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="glass-panel p-6 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium mb-3">Show this at the concession counter</p>
              <img src={qrModalUrl} alt="Concession pickup QR code" className="w-56 h-56 rounded-xl" />
              <button
                onClick={closeQrModal}
                className="mt-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
