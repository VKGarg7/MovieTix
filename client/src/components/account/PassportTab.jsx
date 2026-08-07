import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StampIcon, MapPinIcon, TrophyIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";

const PassportTab = () => {
  const { axios, getToken } = useAppContext();
  const [stamps, setStamps] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await axios.get("/api/user/passport", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && data.success) {
          setStamps(data.stamps);
          setMilestones(data.milestones);
        }
      } catch (error) {
        console.error("Failed to load Cinema Passport:", error);
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
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(63,216,224,0.25), transparent 55%)" }}
        />
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-nebula-cyan/15 border border-nebula-cyan/30">
          <StampIcon className="w-6 h-6 text-nebula-cyan" />
        </div>
        <div className="relative">
          <p className="text-xs text-gray-400">Theaters Stamped</p>
          <p className="text-3xl font-display font-medium gradient-text tabular-nums">{stamps.length}</p>
        </div>
      </motion.div>

      <div>
        <p className="section-eyebrow mb-3 flex items-center gap-2">
          <TrophyIcon className="w-3.5 h-3.5" /> Milestones
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {milestones.map((m) => (
            <div
              key={m.theaterCount}
              className={`glass-panel px-4 py-3 text-center ${m.reached ? "border-nebula-cyan/40" : "opacity-50"}`}
            >
              <p className="text-lg font-display font-medium">{m.theaterCount} theaters</p>
              <p className="text-[11px] text-gray-400">
                {m.reached ? `Unlocked · +${m.bonusPoints} pts` : `+${m.bonusPoints} pts on unlock`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="section-eyebrow mb-3 flex items-center gap-2">
          <MapPinIcon className="w-3.5 h-3.5" /> Your Stamps
        </p>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : stamps.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-gray-400">
              No stamps yet — attend a show and your first theater will be stamped once it's over.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stamps.map((stamp, i) => (
              <motion.div
                key={stamp.theaterId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="flex items-center gap-3 glass-panel glass-panel-hover px-4 py-3"
              >
                <StampIcon className="w-4 h-4 text-nebula-cyan shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{stamp.name}</p>
                  <p className="text-[11px] text-gray-500">{stamp.city}</p>
                </div>
                <p className="text-[11px] text-gray-500">
                  {new Date(stamp.firstVisitedAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportTab;
