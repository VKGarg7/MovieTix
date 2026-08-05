import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDaysIcon, ArmchairIcon, DownloadIcon, QrCodeIcon, ArrowRightIcon, TicketIcon, XIcon } from "lucide-react";
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from "../../context/useAppContext";
import toast from "react-hot-toast";

const BookingsTab = ({ bookings, loading }) => {
  const { axios, getToken, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [downloadingId, setDownloadingId] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [loadingQrId, setLoadingQrId] = useState(null);

  const upcoming = bookings.find((b) => b.show?.showDateTime && new Date(b.show.showDateTime) > new Date());
  const recent = bookings.slice(0, 6);

  const handleDownload = async (item) => {
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

  const handleShowQr = async (item) => {
    setLoadingQrId(item._id);
    try {
      const response = await axios.get(`/api/booking/pickup-qr/${item._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "image/png" }));
      setQrUrl(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load pickup QR code");
    }
    setLoadingQrId(null);
  };

  const closeQr = () => {
    if (qrUrl) window.URL.revokeObjectURL(qrUrl);
    setQrUrl(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming?.show?.movie && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-5 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ background: "radial-gradient(circle at 10% 0%, rgba(248,69,101,0.22), transparent 55%)" }}
          />
          <p className="section-eyebrow mb-3 relative">Upcoming Booking</p>
          <div className="relative flex flex-col sm:flex-row gap-4">
            <img
              src={image_base_url + upcoming.show.movie.poster_path}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full sm:w-28 h-40 sm:h-40 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-display font-medium">{upcoming.show.movie.title}</p>
              <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                <CalendarDaysIcon className="w-4 h-4 shrink-0" /> {dateFormat(upcoming.show.showDateTime)}
              </p>
              {upcoming.bookedSeats?.length > 0 && (
                <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-1.5">
                  <ArmchairIcon className="w-4 h-4 shrink-0" /> {upcoming.bookedSeats.join(", ")}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleDownload(upcoming)}
                  disabled={downloadingId === upcoming._id}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  {downloadingId === upcoming._id ? "Preparing…" : "Add to Calendar"}
                </button>
                {upcoming.snacks?.length > 0 && (
                  <button
                    onClick={() => handleShowQr(upcoming)}
                    disabled={loadingQrId === upcoming._id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <QrCodeIcon className="w-3.5 h-3.5" />
                    {loadingQrId === upcoming._id ? "Loading…" : "Pickup QR"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-eyebrow">Recent Tickets</p>
          <Link to="/my-bookings" className="flex items-center gap-1 text-xs text-primary hover:underline">
            View All <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <TicketIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-center gap-3 glass-panel glass-panel-hover p-3"
              >
                {item.show?.movie ? (
                  <img
                    src={image_base_url + item.show.movie.poster_path}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                    <TicketIcon className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.show?.movie?.title || "Show no longer available"}</p>
                  {item.show?.showDateTime && (
                    <p className="text-xs text-gray-400 mt-0.5">{dateFormat(item.show.showDateTime)}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {currency}
                    {item.amount}
                  </p>
                  <p className="text-[11px] text-gray-500 capitalize">{item.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {qrUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQr}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 relative"
            >
              <button
                onClick={closeQr}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/80 border border-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
              <img src={qrUrl} alt="Pickup QR" className="w-56 h-56 rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingsTab;
