import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import {
  MenuIcon,
  SearchIcon,
  XIcon,
  MapPinIcon,
  ShieldIcon,
  HeartIcon,
  BellIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/useAppContext";
import { useSound } from "../context/SoundContext";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "./cinematic/MagneticButton";
import ProfileMenu from "./cinematic/ProfileMenu";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/flash-seats", label: "Flash Seats" },
  { to: "/theaters", label: "Theaters" },
  { to: "/community/screenings", label: "Open Screen" },
];

const Navbar = ({ onChangeLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef(null);

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { enabled: soundEnabled, toggle: toggleSound, playClick } = useSound();

  const {
    favoriteMovies,
    selectedCity,
    selectedTheater,
    getPendingReferralCode,
    spoilerSafeMode,
    setSpoilerSafeMode,
  } = useAppContext();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      const goingDown = y > lastScrollY.current;
      if (Math.abs(y - lastScrollY.current) > 4) {
        setHidden(goingDown && y > 120);
        lastScrollY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleLogin = () => {
    const referralCode = getPendingReferralCode();
    openSignIn(referralCode ? { unsafeMetadata: { referralCode } } : undefined);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/movies?q=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -110 : 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-4 md:px-10 lg:px-16 pt-4"
    >
      <Link to="/" className="max-md:flex-1">
        <motion.img
          whileHover={{ scale: 1.05 }}
          src={assets.logo}
          alt=""
          className="w-28 h-auto drop-shadow-[0_0_20px_rgba(248,69,101,0.35)]"
        />
      </Link>

      {/* center floating glass pill nav */}
      <div
        className={`max-md:fixed max-md:inset-0 max-md:h-screen max-md:w-full max-md:flex max-md:flex-col max-md:items-center max-md:justify-center z-50 flex md:flex-row items-center gap-8 min-md:px-8 py-3 min-md:rounded-full backdrop-blur-3xl bg-black/85 md:bg-white/[0.055] border border-white/[0.09] transition-all duration-500 ${
          scrolled ? "md:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]" : ""
        } ${isOpen ? "max-md:visible" : "max-md:hidden"}`}
        style={{
          boxShadow: scrolled
            ? "0 1px 0 0 rgba(255,255,255,0.1) inset, 0 20px 50px -15px rgba(0,0,0,0.7)"
            : "0 1px 0 0 rgba(255,255,255,0.06) inset",
        }}
      >
        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />

        {navLinks.map((l) => (
          <Link
            key={l.to}
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to={l.to}
            className="relative text-sm tracking-wide text-gray-200 hover:text-white transition-colors group py-1"
          >
            {l.label}
            <motion.span
              layoutId={`underline-${l.to}`}
              className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-primary via-nebula-amber to-nebula-violet scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
            />
          </Link>
        ))}
        {favoriteMovies.length > 0 && (
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favourite"
            className="relative text-sm tracking-wide text-gray-200 hover:text-white transition-colors group py-1"
          >
            Favourites
            <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-primary via-nebula-amber to-nebula-violet scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-2.5">
        <div className="relative flex items-center">
          <AnimatePresence>
            {searchOpen && (
              <motion.form
                onSubmit={submitSearch}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mr-2 max-md:hidden"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => !searchValue && setSearchOpen(false)}
                  placeholder="Search movies…"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 backdrop-blur-xl"
                />
              </motion.form>
            )}
          </AnimatePresence>
          <MagneticButton
            as={motion.button}
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="max-md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl text-gray-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
            title="Search"
          >
            <SearchIcon className="w-4.5 h-4.5" />
          </MagneticButton>
        </div>

        <MagneticButton
          onClick={() => setSpoilerSafeMode(!spoilerSafeMode)}
          className={`max-lg:hidden w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-colors cursor-pointer ${
            spoilerSafeMode
              ? "text-primary bg-primary/10 border-primary/30"
              : "text-gray-300 border-white/[0.08] bg-white/[0.05] hover:text-white hover:bg-white/[0.1]"
          }`}
          title={spoilerSafeMode ? "Spoiler-safe mode is on" : "Turn on spoiler-safe mode"}
        >
          <ShieldIcon className={`w-4.5 h-4.5 ${spoilerSafeMode ? "fill-primary/30" : ""}`} />
        </MagneticButton>

        <MagneticButton
          onClick={() => {
            playClick();
            toggleSound();
          }}
          className={`max-lg:hidden w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-colors cursor-pointer ${
            soundEnabled
              ? "text-primary bg-primary/10 border-primary/30"
              : "text-gray-300 border-white/[0.08] bg-white/[0.05] hover:text-white hover:bg-white/[0.1]"
          }`}
          title={soundEnabled ? "Mute ambient sound" : "Unmute ambient sound"}
        >
          {soundEnabled ? <Volume2Icon className="w-4.5 h-4.5" /> : <VolumeXIcon className="w-4.5 h-4.5" />}
        </MagneticButton>

        <MagneticButton
          onClick={onChangeLocation}
          className="hidden md:flex items-center gap-1.5 h-10 px-4 rounded-full text-sm text-gray-300 hover:text-white bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl cursor-pointer max-w-40 transition-colors"
          title="Change city/theater"
        >
          <MapPinIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">{selectedTheater ? selectedTheater.name : selectedCity || "Select city"}</span>
        </MagneticButton>

        <MagneticButton
          as={motion.button}
          onClick={() => navigate("/favourite")}
          className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl text-gray-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          title="Wishlist"
        >
          <HeartIcon className="w-4.5 h-4.5" />
          {favoriteMovies.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center shadow-[0_0_10px_rgba(248,69,101,0.7)]">
              {favoriteMovies.length}
            </span>
          )}
        </MagneticButton>

        {user && (
          <div className="relative">
            <MagneticButton
              onClick={() => setNotifOpen((v) => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl text-gray-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Notifications"
            >
              <BellIcon className="w-4.5 h-4.5" />
            </MagneticButton>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-3 w-72 rounded-2xl backdrop-blur-2xl bg-black/80 border border-white/[0.1] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
                >
                  <p className="text-sm font-medium mb-1">Notifications</p>
                  <p className="text-xs text-gray-400 font-light">
                    Follow a movie from its details page to get notified when new showtimes drop.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!user ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleLogin}
            className="ml-1 px-5 py-2.5 bg-primary hover:bg-primary-dull transition-colors rounded-full font-medium text-sm cursor-pointer shadow-[0_0_30px_-8px_rgba(248,69,101,0.7)]"
          >
            Login
          </motion.button>
        ) : (
          <div className="ml-1">
            <ProfileMenu />
          </div>
        )}

        <MenuIcon className="max-md:ml-2 md:hidden w-7 h-7 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
      </div>
    </motion.div>
  );
};

export default Navbar;
