import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useMotionValue, AnimatePresence, animate, motion, useSpring, useTransform } from "framer-motion";
import toast from "react-hot-toast";
import {
  TicketIcon,
  HeartIcon,
  GiftIcon,
  SettingsIcon,
  BellIcon,
  MonitorIcon,
  LanguagesIcon,
  HelpCircleIcon,
  LogOutIcon,
  UserIcon,
  ChevronRightIcon,
  ShieldIcon,
} from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import UpcomingBookingCard from "./UpcomingBookingCard";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
};
const CountUpStat = ({ label, value, i = 0, active }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      delay: 0.15 + i * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, value]);

  return (
    <div className="text-center">
      <p className="font-display text-xl font-medium gradient-text tabular-nums">{display}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">{label}</p>
    </div>
  );
};

const MENU_ITEMS = (nav, isAdmin) => [
  ...(isAdmin
    ? [{ key: "admin", icon: ShieldIcon, label: "Admin Panel", action: () => nav("/admin") }]
    : []),
  { key: "account", icon: UserIcon, label: "Account", action: () => nav("/account") },
  { key: "bookings", icon: TicketIcon, label: "Bookings", action: () => nav("/account?tab=bookings") },
  { key: "wishlist", icon: HeartIcon, label: "Wishlist", action: () => nav("/account?tab=wishlist") },
  { key: "rewards", icon: GiftIcon, label: "Rewards", action: () => nav("/account?tab=rewards") },
  { key: "settings", icon: SettingsIcon, label: "Settings", action: () => nav("/account?tab=security") },
  { key: "notifications", icon: BellIcon, label: "Notifications", action: "soon" },
  { key: "theme", icon: MonitorIcon, label: "Theme", action: "soon" },
  { key: "language", icon: LanguagesIcon, label: "Language", action: "soon" },
  { key: "help", icon: HelpCircleIcon, label: "Help", action: "soon" },
];

const ProfileMenu = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { axios, getToken, favoriteMovies, isAdmin } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState("closed");
  const [stats, setStats] = useState({ bookings: 0, points: 0 });
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 120, damping: 20 });
  const smy = useSpring(my, { stiffness: 120, damping: 20 });
  const spotlightX = useTransform(smx, (v) => `${v * 100}%`);
  const spotlightY = useTransform(smy, (v) => `${v * 100}%`);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStage("closed");
      return;
    }
    setStage("expand");
    const t1 = setTimeout(() => setStage("panel"), 160);
    const t2 = setTimeout(() => setStage("ready"), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [bookingsRes, pointsRes] = await Promise.all([
          axios.get("/api/user/bookings", { params: { category: "Upcoming", page: 1, limit: 1 }, headers }),
          axios.get("/api/user/points", { headers }),
        ]);
        if (cancelled) return;
        setStats({
          bookings: bookingsRes.data?.pageInfo?.total || 0,
          points: pointsRes.data?.balance || 0,
        });
        setUpcoming(bookingsRes.data?.bookings?.[0] || null);
      } catch (error) {
        console.error("Failed to load profile stats:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user, axios, getToken]);

  if (!user) return null;

  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMenuAction = (item) => {
    if (item.action === "soon") {
      toast(`${item.label} is coming soon`, { icon: "✨" });
    } else {
      item.action();
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  const items = MENU_ITEMS(navigate, isAdmin);

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow-[0_0_0_2px_rgba(0,0,0,0)] hover:shadow-[0_0_0_2px_rgba(109,92,255,0.4)] transition-shadow cursor-pointer"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
      >
        <img src={user.imageUrl} alt={user.fullName || "Profile"} className="w-full h-full object-cover" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            onMouseMove={handlePointerMove}
            initial={{ opacity: 0, scale: 0.85, y: -14, transformOrigin: "top right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-3 w-[340px] max-h-[80vh] overflow-y-auto no-scrollbar rounded-[26px] border border-white/10 overflow-hidden z-50"
            style={{
              backdropFilter: "blur(28px) saturate(150%)",
              boxShadow: "0 1px 0 0 rgba(255,255,255,0.1) inset, 0 40px 100px -20px rgba(0,0,0,0.9)",
            }}
          >
            <div className="absolute inset-0 -z-10 bg-[#08080d]/90" />
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(circle at 10% 0%, rgba(109,92,255,0.32), transparent 55%), radial-gradient(circle at 100% 20%, rgba(63,216,224,0.22), transparent 50%)",
              }}
            />
            <div className="noise-overlay" />
            <motion.div
              className="absolute inset-0 -z-10 pointer-events-none opacity-60"
              style={{
                background: `radial-gradient(280px circle at ${spotlightX} ${spotlightY}, rgba(255,255,255,0.06), transparent 70%)`,
              }}
            />

            <div className="relative px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
                  className="relative w-14 h-14 rounded-full overflow-hidden border border-white/15 shrink-0"
                  style={{ boxShadow: "0 0 30px -6px rgba(109,92,255,0.6)" }}
                >
                  <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{getGreeting()}</p>
                  <p className="text-base font-medium truncate">{user.fullName || user.firstName || "Cinephile"}</p>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-2 px-5 py-4 border-b border-white/8">
              <CountUpStat label="Wishlist" value={favoriteMovies.length} i={0} active={stage === "ready"} />
              <CountUpStat label="Bookings" value={stats.bookings} i={1} active={stage === "ready"} />
              <CountUpStat label="Points" value={stats.points} i={2} active={stage === "ready"} />
            </div>

            {(loading || upcoming) && (
              <div className="relative px-5 py-4 border-b border-white/8">
                <p className="section-eyebrow mb-2.5 text-[10px]">Upcoming</p>
                {loading && !upcoming ? (
                  <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ) : (
                  <UpcomingBookingCard
                    booking={upcoming}
                    imageBaseUrl={import.meta.env.VITE_TMDB_IMAGE_BASE_URL}
                    onView={() => {
                      navigate("/my-bookings");
                      setIsOpen(false);
                    }}
                  />
                )}
              </div>
            )}

            <motion.div
              initial="hidden"
              animate={stage === "ready" ? "show" : "hidden"}
              variants={{ show: { transition: { staggerChildren: 0.035 } } }}
              className="relative px-2.5 py-2.5"
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.key}>
                    <motion.button
                      variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                      whileHover={{ x: 2, backgroundColor: "rgba(255,255,255,0.06)" }}
                      onClick={() => handleMenuAction(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
                        item.key === "admin" ? "text-nebula-violet hover:text-nebula-violet" : "text-gray-200 hover:text-white"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                          item.key === "admin"
                            ? "bg-nebula-violet/10 border-nebula-violet/25 group-hover:bg-nebula-violet/20"
                            : "bg-white/5 border-white/10 group-hover:border-white/25 group-hover:bg-primary/10 group-hover:text-primary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </motion.button>
                    {item.key === "admin" && <div className="my-1.5 h-px bg-white/8" />}
                  </React.Fragment>
                );
              })}

              <div className="my-2 h-px bg-white/8" />

              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                whileHover={{ x: 2, backgroundColor: "rgba(248,69,101,0.1)" }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary transition-colors cursor-pointer group"
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                  <LogOutIcon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">Logout</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
