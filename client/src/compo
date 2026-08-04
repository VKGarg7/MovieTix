import React, { useState, useEffect } from "react";
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
    <div id="binge-pass" className="bg-primary/8 border border-primary/20 rounded-lg mb-6 p-4 max-w-3xl scroll-mt-24">
      <div className="flex items-center gap-2 mb-2">
        <TicketIcon className="w-5 h-5 text-primary" />
        <p className="text-sm font-semibold">Binge Pass</p>
      </div>

      {!subscribed ? (
        <>
          <p className="text-sm text-gray-400">
            Watch more for less — get {status?.creditsPerCycle || 4} movie credits every month
            for a flat monthly fee. Use a credit at checkout instead of paying per ticket.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Peak/premium showtimes excluded. Max 1 credit per showtime. Unused credits don't roll over.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="mt-3 px-4 py-2 text-sm bg-primary rounded cursor-pointer disabled:opacity-50"
          >
            {isSubscribing ? "Starting..." : "Subscribe to Binge Pass"}
          </button>
        </>
      ) : (
        <>
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
                <p className="text-xs text-yellow-400">Cancels at period end</p>
                <p className="text-sm text-yellow-400">You'll keep access until renewal date</p>
              </div>
            )}
          </div>
          <button
            onClick={handleManage}
            disabled={isManaging}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm border border-primary/40 text-primary rounded-full cursor-pointer disabled:opacity-50"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            {isManaging ? "Opening..." : "Manage / Cancel Subscription"}
          </button>
        </>
      )}
    </div>
  );
};

export default BingePass;