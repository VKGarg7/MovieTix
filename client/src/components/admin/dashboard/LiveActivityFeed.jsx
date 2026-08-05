import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCardIcon, XCircleIcon, ClockIcon, RadioIcon } from "lucide-react";
import { useAppContext } from "../../../context/useAppContext";
import usePolling from "../../../hooks/usePolling";

const POLL_INTERVAL_MS = 15000;

const EVENT_META = {
  confirmed: { icon: CreditCardIcon, tone: "cyan", label: "Payment confirmed" },
  cancelled: { icon: XCircleIcon, tone: "primary", label: "Booking cancelled" },
  "pending-cancellation": { icon: ClockIcon, tone: "amber", label: "Cancellation pending" },
  pending: { icon: ClockIcon, tone: "gray", label: "Awaiting payment" },
};

const TONE_STYLES = {
  cyan: "bg-nebula-cyan/10 border-nebula-cyan/25 text-nebula-cyan",
  primary: "bg-primary/10 border-primary/25 text-primary",
  amber: "bg-nebula-amber/10 border-nebula-amber/25 text-nebula-amber",
  gray: "bg-white/5 border-white/10 text-gray-400",
};

const timeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const LiveActivityFeed = () => {
  const { axios, getToken } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(
    async (isCancelled) => {
      try {
        const { data } = await axios.get("/api/admin/recent-activity", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!isCancelled() && data.success) setEvents(data.events);
      } catch (error) {
        console.error("Failed to load activity feed:", error);
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    POLL_INTERVAL_MS,
    { deps: [axios, getToken] }
  );

  return (
    <div className="relative glass-panel p-5 md:p-6 h-full flex flex-col overflow-hidden">
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(63,216,224,0.5), transparent 70%)" }}
      />
      <div className="relative flex items-center gap-2 mb-4">
        <span className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-nebula-cyan/15 border border-nebula-cyan/30">
          <RadioIcon className="w-4 h-4 text-nebula-cyan" />
        </span>
        <p className="text-sm font-medium">Live Activity</p>
        <span className="ml-auto text-[10px] text-gray-500">refreshes every 15s</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-400">No recent activity.</p>
      ) : (
        <div className="relative flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-96">
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const meta = EVENT_META[event.status] || EVENT_META.pending;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/8 bg-white/[0.02]"
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${TONE_STYLES[meta.tone]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-200 truncate">
                      {meta.label}
                      {event.movieTitle ? ` · ${event.movieTitle}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {currency}
                      {event.amount} · {event.bookedSeats?.length || 0} seat{event.bookedSeats?.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(event.updatedAt)}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
