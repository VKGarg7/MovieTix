import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

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

const MyBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

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

  useEffect(() => {
    if (!user) return;
    getMyBookings(activeTab, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, page]);

  useEffect(() => {
    if (!user) return;
    refreshTabCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  useEffect(() => {
    if (!user) return;
    getPointsBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  useEffect(() => {
    if (!user) return;
    getReferralInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />

      <div>
        <BlurCircle bottom="0px" right="600px" />
      </div>

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      <div className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-lg mb-4 p-4 max-w-3xl">
        <div>
          <p className="text-sm text-gray-400">Loyalty points balance</p>
          <p className="text-2xl font-semibold text-primary">{pointsBalance}</p>
        </div>
        <button
          onClick={togglePointsHistory}
          className="text-sm text-primary font-medium cursor-pointer"
        >
          {showPointsHistory ? "Hide history" : "View history"}
        </button>
      </div>

      {showPointsHistory && (
        <div className="max-w-3xl mb-6 border border-primary/20 rounded-lg overflow-hidden">
          {pointsHistory.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">No points activity yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {pointsHistory.map((tx) => (
                  <tr key={tx._id} className="border-b border-primary/10 last:border-0">
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
        </div>
      )}

      {referralCode && (
        <div className="bg-primary/8 border border-primary/20 rounded-lg mb-6 p-4 max-w-3xl">
          <p className="text-sm text-gray-400">Invite friends, earn points</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Share your link — when a friend signs up and completes their first booking, you both earn points.
            {referralCount > 0 && ` You've referred ${referralCount} friend${referralCount > 1 ? "s" : ""} so far.`}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              onClick={(e) => e.target.select()}
              className="flex-1 bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 text-sm bg-primary rounded cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 border-b border-primary/20 max-w-3xl">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2 text-sm font-medium cursor-pointer border-b-2 -mb-px transition ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {bookings.length === 0 && (
        <p className="text-gray-400 text-sm mt-6">No {activeTab.toLowerCase()} bookings.</p>
      )}

      {bookings.map((item, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
        >
          {/* Displaying booking details */}
          <div className="flex flex-col md:flex-row">
            {item.show?.movie ? (
              <>
                <img
                  src={image_base_url + item.show.movie.poster_path}
                  alt=""
                  className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
                />

                <div className="flex flex-col p-4">
                  <p className="text-lg font-semibold">{item.show.movie.title}</p>
                  <p className="text-gray-400 text-sm">
                    {timeFormat(item.show.movie.runtime)}
                  </p>
                  <p className="text-gray-400 text-sm mt-auto">
                    {dateFormat(item.show.showDateTime)}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold text-gray-400">Show no longer available</p>
              </div>
            )}
          </div>

          {/* Displaying booking summary */}
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
                <button
                  onClick={() => handleAddToCalendar(item)}
                  disabled={downloadingId === item._id}
                  className="border border-primary text-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === item._id ? "Preparing..." : "Add to Calendar"}
                </button>
              }

              {item.isPaid && item.status !== "cancelled" && item.status !== "pending-cancellation" && item.snacks?.length > 0 &&
                <button
                  onClick={() => handleShowQr(item._id)}
                  disabled={loadingQrId === item._id}
                  className="border border-primary text-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50"
                >
                  {loadingQrId === item._id ? "Loading..." : item.concessionPickedUp ? "View Pickup QR (used)" : "Show Pickup QR"}
                </button>
              }

              {!item.isPaid && item.status !== "cancelled" &&
                <a
                  href={item.paymentLink}
                  className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                >
                  Pay Now
                </a>
              }
              {canCancel(item) &&
                <button
                  onClick={() => handleCancel(item._id)}
                  disabled={cancellingId === item._id}
                  className="border border-red-500 text-red-500 px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50"
                >
                  {cancellingId === item._id ? "Cancelling..." : "Cancel Booking"}
                </button>
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
        </div>
      ))}

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

      {qrModalUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
          onClick={closeQrModal}
        >
          <div
            className="bg-[#1f1f24] border border-primary/20 rounded-lg p-6 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium mb-3">Show this at the concession counter</p>
            <img src={qrModalUrl} alt="Concession pickup QR code" className="w-56 h-56" />
            <button
              onClick={closeQrModal}
              className="mt-4 text-sm text-gray-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
