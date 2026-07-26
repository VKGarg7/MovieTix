import React, { useEffect, useMemo, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const CANCELLATION_CUTOFF_HOURS = 2;
const TABS = ["Upcoming", "Completed", "Cancelled"];

// Bookings are grouped client-side from showDateTime + isPaid + status (no dedicated
// endpoint needed): a cancelled/pending-cancellation booking is always "Cancelled",
// a paid booking whose show hasn't started yet is "Upcoming", everything else
// (past showtime, or unpaid/expired) falls into "Completed".
const getCategory = (item) => {
  if (item.status === "cancelled" || item.status === "pending-cancellation") {
    return "Cancelled";
  }
  const showTime = item.show?.showDateTime ? new Date(item.show.showDateTime).getTime() : null;
  if (item.isPaid && showTime && showTime > Date.now()) {
    return "Upcoming";
  }
  return "Completed";
};

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

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    getMyBookings();
  }, [user, axios, getToken]);

  const groupedBookings = useMemo(() => {
    const groups = { Upcoming: [], Completed: [], Cancelled: [] };
    bookings.forEach((item) => {
      groups[getCategory(item)].push(item);
    });
    return groups;
  }, [bookings]);

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
        getMyBookings();
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

  const activeBookings = groupedBookings[activeTab];

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />

      <div>
        <BlurCircle bottom="0px" right="600px" />
      </div>

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      <div className="flex gap-2 mb-4 border-b border-primary/20 max-w-3xl">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium cursor-pointer border-b-2 -mb-px transition ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab} ({groupedBookings[tab].length})
          </button>
        ))}
      </div>

      {activeBookings.length === 0 && (
        <p className="text-gray-400 text-sm mt-6">No {activeTab.toLowerCase()} bookings.</p>
      )}

      {activeBookings.map((item, index) => (
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
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
