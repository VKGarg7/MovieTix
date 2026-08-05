import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/useAppContext";
import { TicketIcon, ExternalLinkIcon } from "lucide-react";
import toast from "react-hot-toast";

const BingePass = () => {
  const { axios, getToken, user } = useAppContext();

  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get("/api/subscription/binge-pass/status", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setStatus(data);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const { data } = await axios.post(
        "/api/subscription/binge-pass",
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start subscription");
    }
    setIsSubscribing(false);
  };

  const handleManage = async () => {
    setIsManaging(true);
    try {
      const { data } = await axios.get("/api/subscription/binge-pass/manage", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to open subscription management");
    }
    setIsManaging(false);
  };

  if (isLoading) return null;

  const subscribed = status?.subscribed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      id="binge-pass"
      className="relative glass-panel p-5 mb-6 max-w-3xl scroll-mt-24 overflow-hidden"
    >
      <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #FFB86B, transparent 70%)" }} />

      <div className="flex items-center gap-2 mb-2 relative z-10">
        <TicketIcon className="w-5 h-5 text-nebula-amber" />
        <p className="text-sm font-medium font-display text-base">Binge Pass</p>
      </div>

      {!subscribed ? (
        <div className="relative z-10">
          <p className="text-sm text-gray-400 font-light">
            Watch more for less — get {status?.creditsPerCycle || 4} movie credits every month
            for a flat monthly fee. Use a credit at checkout instead of paying per ticket.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Peak/premium showtimes excluded. Max 1 credit per showtime. Unused credits don't roll over.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="mt-3 px-5 py-2.5 text-sm bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer disabled:opacity-50"
          >
            {isSubscribing ? "Starting..." : "Subscribe to Binge Pass"}
          </motion.button>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Credits remaining</p>
              <p className="text-2xl font-semibold text-primary">
                {status.creditsRemaining}
                <span className="text-sm text-gray-400"> / {status.creditsPerCycle}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Renews on</p>
              <p className="text-sm font-medium">
                {status.currentPeriodEnd
                  ? new Date(status.currentPeriodEnd).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            {status.cancelAtPeriodEnd && (
              <div>
                <p className="text-xs text-nebula-amber">Cancels at period end</p>
                <p className="text-sm text-nebula-amber">You'll keep access until renewal date</p>
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleManage}
            disabled={isManaging}
            className="mt-3 flex items-center gap-1.5 px-4 py-2.5 text-sm border border-primary/40 text-primary rounded-full cursor-pointer disabled:opacity-50 hover:bg-primary/10 transition-colors"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            {isManaging ? "Opening..." : "Manage / Cancel Subscription"}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default BingePass;
