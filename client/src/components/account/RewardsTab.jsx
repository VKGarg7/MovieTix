import React, { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { GiftIcon, PlusCircleIcon, MinusCircleIcon, HistoryIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const REASON_LABEL = {
  earned: "Earned",
  redeemed: "Redeemed",
  refunded_redemption: "Refunded",
  reversed_earning: "Reversed",
};

const CountUp = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [value]);
  return <span>{display}</span>;
};

const RewardsTab = ({ pointsBalance }) => {
  const { axios, getToken } = useAppContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await axios.get("/api/user/points/history", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && data.success) setHistory(data.transactions);
      } catch (error) {
        console.error("Failed to load points history:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [axios, getToken]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-6 relative overflow-hidden flex items-center gap-4"
      >
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(109,92,255,0.25), transparent 55%)" }}
        />
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-nebula-violet/15 border border-nebula-violet/30">
          <GiftIcon className="w-6 h-6 text-nebula-violet" />
        </div>
        <div className="relative">
          <p className="text-xs text-gray-400">Loyalty Points Balance</p>
          <p className="text-3xl font-display font-medium gradient-text tabular-nums">
            <CountUp value={pointsBalance} />
          </p>
        </div>
      </motion.div>

      <div>
        <p className="section-eyebrow mb-3 flex items-center gap-2">
          <HistoryIcon className="w-3.5 h-3.5" /> Points History
        </p>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-gray-400">No points activity yet — book a show to start earning.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((tx, i) => (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="flex items-center gap-3 glass-panel glass-panel-hover px-4 py-3"
              >
                {tx.delta >= 0 ? (
                  <PlusCircleIcon className="w-4 h-4 text-nebula-cyan shrink-0" />
                ) : (
                  <MinusCircleIcon className="w-4 h-4 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{REASON_LABEL[tx.reason] || tx.reason}</p>
                  <p className="text-[11px] text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <p className={`text-sm font-medium tabular-nums ${tx.delta >= 0 ? "text-nebula-cyan" : "text-primary"}`}>
                  {tx.delta >= 0 ? "+" : ""}
                  {tx.delta}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsTab;
