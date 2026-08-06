import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOffIcon, XIcon, TicketIcon, HistoryIcon, GiftIcon, UsersIcon, ClockIcon, SparklesIcon, WalletCardsIcon, RepeatIcon } from "lucide-react";
import Loading from "../components/Loading";
import PageHeader from "../components/cinematic/PageHeader";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import useFetchOnUser from "../hooks/useFetchOnUser";
import useScrollToHash from "../hooks/useScrollToHash";
import BingePass from "../components/BingePass";
import TicketTransferModal from "../components/TicketTransferModal";

const TRANSFER_CUTOFF_MINUTES = 30;

const CANCELLATION_CUTOFF_HOURS = 2;
const TABS = ["Upcoming", "Completed", "Cancelled"];

const formatCountdown = (ms) => {
  if (ms <= 0) return "Starting now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `starts in ${days}d ${hours}h`;
  if (hours > 0) return `starts in ${hours}h ${minutes}m`;
  return `starts in ${minutes}m`;
};

const Countdown = ({ showDateTime }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = new Date(showDateTime).getTime() - now;

  return (
    <p className="text-sm font-medium text-primary mb-3">
      {formatCountdown(remainingMs)}
    </p>
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

const MyBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const location = useLocation();

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
  const [transferModalBooking, setTransferModalBooking] = useState(null);

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
      setTabCounts({
        Upcoming: results[0].data.pageInfo?.total || 0,
        Completed: results[1].data.pageInfo?.total || 0,
        Cancelled: results[2].data.pageInfo?.total || 0,
      });
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

  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
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

  const canTransfer = (item) =>
    item.isPaid &&
    item.status === "confirmed" &&
    item.show?.showDateTime &&
    new Date(item.show.showDateTime).getTime() - Date.now() >
      TRANSFER_CUTOFF_MINUTES * 60 * 1000;

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

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <PageHeader eyebrow="Your Account" title="My Bookings" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
        <Link
          to="/wrapped"
          className="flex items-center gap-2 text-sm text-nebula-violet font-medium hover:underline w-fit"
        >
          <SparklesIcon className="w-4 h-4" />
          See your MovieTix Wrapped
        </Link>
        <Link
          to="/gift-card/buy"
          className="flex items-center gap-2 text-sm text-primary font-medium hover:underline w-fit"
        >
          <WalletCardsIcon className="w-4 h-4" />
          Buy a Gift Card
        </Link>
        <Link
          to="/resale"
          className="flex items-center gap-2 text-sm text-primary font-medium hover:underline w-fit"
        >
          <RepeatIcon className="w-4 h-4" />
          Browse Resale Tickets
        </Link>
      </div>

      <BingePass />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="flex items-center justify-between glass-panel mb-4 p-5 max-w-3xl"
      >
        <div className="flex items-center gap-3">
          <TicketIcon className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm text-gray-400">Loyalty points balance</p>
            <p className="text-2xl font-semibold text-primary">{pointsBalance}</p>
          </div>
        </div>
        <button
          onClick={togglePointsHistory}
          className="flex items-center gap-1.5 text-sm text-primary font-medium cursor-pointer hover:underline"
        >
          <HistoryIcon className="w-4 h-4" />
          {showPointsHistory ? "Hide history" : "View history"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showPointsHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mb-6 glass-panel overflow-hidden"
          >
            {pointsHistory.length === 0 ? (
              <p className="text-gray-400 text-sm p-4">No points activity yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {pointsHistory.map((tx) => (
                    <tr key={tx._id} className="border-b border-white/5 last:border-0">
                      <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 capitalize">{tx.reason.replace(/_/g, ' ')}</td>
                      <td className={`p-3 text-right font-medium ${tx.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.delta > 0 ? '+' : ''}{tx.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel mb-6 p-5 max-w-3xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <GiftIcon className="w-4 h-4 text-nebula-violet" />
            <p className="text-sm font-medium">Invite friends, earn points</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 mb-3 font-light">
            Share your link — when a friend signs up and completes their first booking, you both earn points.
            {referralCount > 0 && ` You've referred ${referralCount} friend${referralCount > 1 ? "s" : ""} so far.`}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              onClick={(e) => e.target.select()}
              className="flex-1 glass-input"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={copyReferralLink}
              className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer"
            >
              Copy
            </motion.button>
          </div>
        </motion.div>
      )}

      {groupBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="watch-parties"
          className="max-w-3xl mb-6 scroll-mt-24"
        >
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><UsersIcon className="w-4 h-4 text-primary" /> My Watch Parties</p>
          <div className="flex flex-col gap-2">
            {groupBookings.map((group) => (
              <Link
                key={group.groupId}
                to={`/group-booking/${group.groupId}/manage`}
                className="flex items-center justify-between glass-panel glass-panel-hover px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium">{group.show?.movieTitle || "Show no longer available"}</p>
                  {group.show?.showDateTime && (
                    <p className="text-xs text-gray-400">{dateFormat(group.show.showDateTime)}</p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p className="capitalize">{group.status}</p>
                  <p>{group.claimedCount}/{group.totalSeats} claimed &middot; {group.paidCount}/{group.totalSeats} paid</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {waitlistEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="waitlist"
          className="max-w-3xl mb-6 scroll-mt-24"
        >
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><ClockIcon className="w-4 h-4 text-primary" /> My Waitlist</p>
          <div className="flex flex-col gap-2">
            {waitlistEntries.map((entry) => (
              <div
                key={entry.waitlistEntryId}
                className="flex items-center justify-between glass-panel px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium">{entry.show?.movieTitle || "Show no longer available"}</p>
                  {entry.show?.showDateTime && (
                    <p className="text-xs text-gray-400">{dateFormat(entry.show.showDateTime)}</p>
                  )}
                  {entry.status === "waiting" && (
                    <p className="text-xs text-gray-400 mt-1">Position #{entry.position} in line</p>
                  )}
                  {entry.status === "offered" && (
                    <p className="text-xs text-primary mt-1">
                      Seat {entry.offeredSeat} offered &mdash; <ClaimCountdown offerExpiresAt={entry.offerExpiresAt} />
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {entry.status === "offered" && (
                    <Link
                      to={`/waitlist/${entry.waitlistEntryId}/claim`}
                      className="px-3.5 py-1.5 text-xs bg-primary rounded-full font-medium"
                    >
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

      <div className="flex gap-1 mb-6 max-w-3xl relative">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`relative px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab} ({tabCounts[tab]})
            {activeTab === tab && (
              <motion.div
                layoutId="mybookings-tab-underline"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-nebula-amber"
              />
            )}
          </button>
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      </div>

      {bookings.length === 0 && (
        <p className="text-gray-400 text-sm mt-6 font-light">No {activeTab.toLowerCase()} bookings.</p>
      )}

      <AnimatePresence mode="popLayout">
        {bookings.map((item, index) => (
          <motion.div
            layout
            key={item._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row justify-between glass-panel glass-panel-hover mt-4 p-3 max-w-3xl"
          >
            <div className="flex flex-col md:flex-row">
              {item.show?.movie ? (
                item.show.movie.isMysteryMovie ? (
                  <>
                    <div className="md:max-w-45 md:w-45 aspect-video h-auto bg-gradient-to-br from-primary/30 to-void rounded-2xl flex flex-col items-center justify-center gap-1">
                      <EyeOffIcon className="w-8 h-8 text-primary" />
                      <p className="text-xs">Mystery Movie</p>
                    </div>

                    <div className="flex flex-col p-4">
                      <p className="text-lg font-display font-medium">Mystery Movie</p>
                      <p className="text-gray-400 text-sm">
                        {item.show.movie.genres?.map((g) => g.name).join(", ")} &middot; {item.show.movie.ratingBand}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Revealed at the theater — your ticket won't show the title.
                      </p>
                      <p className="text-gray-400 text-sm mt-auto">
                        {dateFormat(item.show.showDateTime)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={image_base_url + item.show.movie.poster_path}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded-2xl"
                    />

                    <div className="flex flex-col p-4">
                      <p className="text-lg font-display font-medium">{item.show.movie.title}</p>
                      <p className="text-gray-400 text-sm">
                        {timeFormat(item.show.movie.runtime)}
                      </p>
                      <p className="text-gray-400 text-sm mt-auto">
                        {dateFormat(item.show.showDateTime)}
                      </p>
                    </div>
                  </>
                )
              ) : (
                <div className="flex flex-col p-4">
                  <p className="text-lg font-medium text-gray-400">Show no longer available</p>
                </div>
              )}
            </div>

            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex flex-col md:items-end items-start gap-1">
                <p className="text-2xl font-semibold mb-2">
                  {currency}
                  {item.amount}
                </p>

                {activeTab === "Upcoming" && item.show?.showDateTime && (
                  <Countdown showDateTime={item.show.showDateTime} />
                )}

                {item.isPaid && item.status !== "cancelled" && item.status !== "pending-cancellation" && item.show?.movie &&
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAddToCalendar(item)}
                    disabled={downloadingId === item._id}
                    className="border border-primary text-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors"
                  >
                    {downloadingId === item._id ? "Preparing..." : "Add to Calendar"}
                  </motion.button>
                }

                {item.isPaid && item.status !== "cancelled" && item.status !== "pending-cancellation" && item.snacks?.length > 0 &&
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleShowQr(item._id)}
                    disabled={loadingQrId === item._id}
                    className="border border-primary text-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors"
                  >
                    {loadingQrId === item._id ? "Loading..." : item.concessionPickedUp ? "View Pickup QR (used)" : "Show Pickup QR"}
                  </motion.button>
                }

                {!item.isPaid && item.status !== "cancelled" &&
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    href={item.paymentLink}
                    className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                  >
                    Pay Now
                  </motion.a>
                }
                {canTransfer(item) &&
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setTransferModalBooking(item)}
                    className="border border-primary text-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                  >
                    <RepeatIcon className="w-3.5 h-3.5" />
                    Transfer / Resell
                  </motion.button>
                }
                {canCancel(item) &&
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleCancel(item._id)}
                    disabled={cancellingId === item._id}
                    className="border border-red-500 text-red-500 px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-red-500/10 transition-colors"
                  >
                    {cancellingId === item._id ? "Cancelling..." : "Cancel Booking"}
                  </motion.button>
                }
                {item.status === "cancelled" &&
                  <p className="text-sm text-red-500 mb-3">Cancelled &middot; Refunded</p>
                }
                {item.status === "pending-cancellation" &&
                  <p className="text-sm text-yellow-500 mb-3">Cancelled &middot; Refund pending</p>
                }
              </div>

              <div className="text-sm">
                <p>
                  <span className="text-gray-400">Total Tickets:</span>
                  {item.bookedSeats.length}
                </p>
                <p>
                  <span className="text-gray-400">Seat Number:</span>
                  {item.bookedSeats.join(", ")}
                </p>
                {item.snacks?.length > 0 && (
                  <p>
                    <span className="text-gray-400">Snacks:</span>
                    {item.snacks.map((s) => `${s.quantity}x ${s.name}`).join(", ")}
                  </p>
                )}
                {item.pointsRedeemed > 0 && (
                  <p>
                    <span className="text-gray-400">Points redeemed:</span>
                    {item.pointsRedeemed} (-{currency}{item.pointsDiscountAmount})
                  </p>
                )}
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
            className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

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

      {transferModalBooking && (
        <TicketTransferModal
          booking={transferModalBooking}
          onClose={() => setTransferModalBooking(null)}
          onDone={() => {
            setTransferModalBooking(null);
            getMyBookings(activeTab, page);
          }}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
