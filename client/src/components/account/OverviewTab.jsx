import React, { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { TicketIcon, HeartIcon, GiftIcon, CalendarCheckIcon } from "lucide-react";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
};

const CountUp = ({ value, i = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      delay: 0.2 + i * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{display}</span>;
};

const StatCard = ({ icon: Icon, label, value, i, tone = "primary" }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -3 }}
    className="glass-panel p-5 relative overflow-hidden"
  >
    <div
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30"
      style={{ background: tone === "primary" ? "#F84565" : "#6D5CFF" }}
    />
    <Icon className={`w-5 h-5 mb-3 relative ${tone === "primary" ? "text-primary" : "text-nebula-violet"}`} />
    <p className="text-2xl font-display font-medium relative tabular-nums">
      <CountUp value={value} i={i} />
    </p>
    <p className="text-xs text-gray-400 mt-1 relative">{label}</p>
  </motion.div>
);

const OverviewTab = ({ stats, upcomingCount }) => {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-6 md:p-8 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(109,92,255,0.25), transparent 55%), radial-gradient(circle at 90% 80%, rgba(63,216,224,0.18), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-full overflow-hidden border border-white/15 shrink-0"
            style={{ boxShadow: "0 0 40px -8px rgba(109,92,255,0.6)" }}
          >
            <img src={user?.imageUrl} alt="" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <p className="text-sm text-gray-400">{getGreeting()}</p>
            <h1 className="font-display text-3xl md:text-4xl font-medium mt-0.5">
              {user?.fullName || user?.firstName || "Cinephile"}
            </h1>
            <p className="text-xs text-gray-500 mt-1.5">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TicketIcon} label="Total Bookings" value={stats.totalBookings} i={0} />
        <StatCard icon={CalendarCheckIcon} label="Upcoming Shows" value={upcomingCount} i={1} tone="violet" />
        <StatCard icon={HeartIcon} label="Wishlist" value={stats.wishlist} i={2} />
        <StatCard icon={GiftIcon} label="Reward Points" value={stats.points} i={3} tone="violet" />
      </div>
    </div>
  );
};

export default OverviewTab;
