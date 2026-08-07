import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import timeFormat from "../lib/timeFormat";
import isoTimeFormat from "../lib/isoTimeFormat";
import {
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Heart,
  PlayCircleIcon,
  BellIcon,
  BellRingIcon,
  EyeOffIcon,
  FilmIcon,
  CalendarIcon,
  ClockIcon,
  Volume2Icon,
  MonitorPlayIcon,
  ImageIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TicketIcon,
  ThumbsUpIcon,
  UsersIcon,
  HeartHandshakeIcon,
  RadioTowerIcon,
  ShuffleIcon,
} from "lucide-react";
import { ACCOMMODATION_LABELS } from "../lib/accommodations";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import AnimatedTitle from "../components/cinematic/AnimatedTitle";
import RevealSection from "../components/cinematic/RevealSection";
import FlyInCard from "../components/cinematic/FlyInCard";
import TrailerModal from "../components/cinematic/TrailerModal";
import CircularRating from "../components/cinematic/CircularRating";
import GlassPanel from "../components/cinematic/GlassPanel";
import MetaChip from "../components/cinematic/MetaChip";
import RatingStars from "../components/cinematic/RatingStars";
import ReviewCard from "../components/cinematic/ReviewCard";
import EmotionalBreakdown from "../components/cinematic/EmotionalBreakdown";
import { getTheaterPresentation } from "../lib/theaterPresentation";
import { EASE_CINEMATIC } from "../lib/motion";
import { dummyTrailers } from "../assets/assets";
import { useAppContext } from "../context/useAppContext";
import toast from "react-hot-toast";

const isDateSoldOut = (showtimes) => showtimes.every((s) => s.isSoldOut);

const seatsLeftBadge = (showtime) => {
  const { totalCapacity, occupiedCount } = showtime;
  if (!totalCapacity) return null;
  const left = totalCapacity - (occupiedCount || 0);
  if (left <= 0) return null;
  const pctLeft = left / totalCapacity;
  if (pctLeft <= 0.15) return { label: "Almost Full", tone: "danger" };
  if (pctLeft <= 0.4) return { label: "Fast Filling", tone: "amber" };
  return null;
};

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const {
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
    selectedTheater,
    setSelectedTheater,
    fetchShowDetails,
    fetchTheaters,
    selectedCity,
    spoilerSafeMode,
  } = useAppContext();

  const [similarMovies, setSimilarMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [emotionalBreakdown, setEmotionalBreakdown] = useState([]);
  const [emotionalTotal, setEmotionalTotal] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);

  const [theaters, setTheaters] = useState([]);
  const [activeTheater, setActiveTheater] = useState(selectedTheater || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [joiningShowId, setJoiningShowId] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, 260]);
  const bgScale = useTransform(scrollY, [0, 900], [1, 1.15]);
  const bgOpacity = useTransform(scrollY, [0, 700], [0.55, 0]);
  const stickyBarOpacity = useTransform(scrollY, [500, 700], [0, 1]);
  const stickyBarY = useTransform(scrollY, [500, 700], [30, 0]);

  const getShow = async () => {
    const data = await fetchShowDetails(id, activeTheater?._id);
    if (data) {
      setShow(data);
      const dates = Object.keys(data.dateTime || {});
      setSelectedDate((prev) => (prev && dates.includes(prev) ? prev : dates[0] || null));
    }
  };

  const getTheaters = async () => {
    const list = await fetchTheaters(selectedCity);
    setTheaters(list);
    if (!activeTheater && list.length > 0) {
      setActiveTheater(list[0]);
    }
  };

  const getSimilarMovies = async () => {
    try {
      const { data } = await axios.get(`/api/show/similar/${id}`);
      if (data.success) {
        setSimilarMovies(data.movies);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getReviews = async () => {
    try {
      const { data } = await axios.get(`/api/review/${id}`);
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getEmotionalBreakdown = async () => {
    try {
      const { data } = await axios.get(`/api/emotional-pulse/movie/${id}`);
      if (data.success) {
        setEmotionalBreakdown(data.breakdown);
        setEmotionalTotal(data.total);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getMyReview = async () => {
    if (!user) {
      setMyReview(null);
      setReviewRating(0);
      setReviewText("");
      setReviewSpoiler(false);
      return;
    }
    try {
      const { data } = await axios.get(`/api/review/me/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setMyReview(data.review);
        setReviewRating(data.review?.rating || 0);
        setReviewText(data.review?.text || "");
        setReviewSpoiler(data.review?.spoiler || false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getWatchedStatus = async () => {
    if (!user) {
      setHasWatched(false);
      return;
    }
    try {
      const { data } = await axios.get(`/api/review/watched/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setHasWatched(data.watched);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1) {
      return toast.error("Please select a rating");
    }
    setSubmittingReview(true);
    try {
      const { data } = await axios.post(
        "/api/review",
        { movieId: id, rating: reviewRating, text: reviewText, spoiler: reviewSpoiler },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(myReview ? "Review updated" : "Review submitted");
        setMyReview(data.review);
        getReviews();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    }
    setSubmittingReview(false);
  };

  const getFollowStatus = async () => {
    if (!user) {
      setIsFollowing(false);
      return;
    }
    try {
      const { data } = await axios.get(`/api/user/follow/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setIsFollowing(data.following);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) return toast.error("Please login to follow this movie");
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { data } = await axios.delete(`/api/user/follow/${id}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          setIsFollowing(false);
          toast.success("Unfollowed. You won't be notified about new shows.");
        }
      } else {
        const { data } = await axios.post(
          "/api/user/follow",
          { movieId: id },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        if (data.success) {
          setIsFollowing(true);
          toast.success("Following! We'll email you when a show is added.");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update follow status");
    }
    setFollowLoading(false);
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to add to favorites");
      const { data } = await axios.post(
        "api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleJoinWaitlist = async (showId) => {
    if (!user) return toast.error("Please login to join the waitlist");
    setJoiningShowId(showId);
    try {
      const { data } = await axios.post(
        "/api/waitlist/join",
        { showId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`You're #${data.position} on the waitlist — we'll email you if a seat opens up!`);
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "ALREADY_ON_WAITLIST") {
        toast.error("You're already on the waitlist for this show");
      } else {
        toast.error(error.response?.data?.message || "Failed to join waitlist");
      }
    }
    setJoiningShowId(null);
  };

  const handleSelectTheater = (theater) => {
    setActiveTheater(theater);
    setSelectedTheater(theater);
  };

  const handleSelectShowtime = (showtime) => {
    if (showtime.isSoldOut) return;
    navigate(`/book/${id}?date=${selectedDate}&showId=${showtime.showId}`);
    scrollTo(0, 0);
  };

  useEffect(() => {
    getShow();
    getReviews();
    getEmotionalBreakdown();
    getSimilarMovies();
    getTheaters();
    // re-run when the movie id or active theater changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTheater?._id]);

  useEffect(() => {
    getMyReview();
    getFollowStatus();
    getWatchedStatus();
    // re-run when the movie id or signed-in user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const isMystery = show?.movie?.isMysteryMovie;

  const gallery = useMemo(() => {
    if (!show?.movie) return [];
    return [show.movie.backdrop_path, show.movie.poster_path].filter(Boolean);
  }, [show]);

  const dateList = show ? Object.keys(show.dateTime || {}) : [];
  const showtimesForDate = selectedDate && show ? show.dateTime[selectedDate] || [] : [];

  if (!show) return <Loading />;

  return (
    <div className="relative">
      {!isMystery && (
        <motion.div
          className="fixed top-0 left-0 w-full h-[110vh] -z-40 pointer-events-none"
          style={{ y: bgY, scale: bgScale, opacity: bgOpacity }}
        >
          <img
            src={image_base_url + (show.movie.backdrop_path || show.movie.poster_path)}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/70 to-void/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/40 to-transparent" />
        </motion.div>
      )}

      {/* sticky booking bar */}
      {!isMystery && (
        <motion.div
          style={{ opacity: stickyBarOpacity, y: stickyBarY }}
          className="fixed top-16 left-0 right-0 z-40 pointer-events-none"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-40">
            <div className="glass-panel flex items-center justify-between gap-4 px-5 py-3 pointer-events-auto">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={image_base_url + show.movie.poster_path}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{show.movie.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {activeTheater?.name || "Select a theater"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-glow shrink-0 px-6 py-2.5 text-sm rounded-full font-medium cursor-pointer border border-white/10"
              >
                Book Tickets
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="px-6 md:px-16 lg:px-40 pt-36 md:pt-52">
        <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto items-start">
          {isMystery ? (
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
              className="max-md:mx-auto glass-panel h-104 max-w-70 w-70 bg-gradient-to-br from-primary/30 to-void flex flex-col items-center justify-center gap-3 shrink-0"
              style={{ transformPerspective: 1000 }}
            >
              <EyeOffIcon className="w-14 h-14 text-primary" />
              <p className="font-medium">Mystery Movie</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              whileHover={{ rotateY: 8, rotateX: -4, scale: 1.03 }}
              transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
              className="max-md:mx-auto relative shrink-0"
              style={{ transformPerspective: 1200, transformStyle: "preserve-3d" }}
            >
              <div className="absolute -inset-4 rounded-[32px] bg-primary/25 blur-3xl -z-10" />
              <img
                src={image_base_url + show.movie.poster_path}
                alt=""
                className="rounded-[24px] h-104 max-w-70 object-cover border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]"
              />
            </motion.div>
          )}

          <div className="relative flex flex-col gap-4 flex-1">
            <span className="section-eyebrow px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl w-max">
              {show.movie.original_language?.toUpperCase() || "EN"} · Now Screening
            </span>

            <AnimatedTitle
              text={isMystery ? "Mystery Movie" : show.movie.title}
              className="text-4xl md:text-5xl font-display font-medium max-w-xl glow-text"
            />

            {isMystery ? (
              <>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl font-light">
                  Only the genre, runtime and rating band are revealed before you book —
                  the title stays a surprise{show.dateTime && Object.values(show.dateTime).flat().some(s => s.mysteryRevealAt === 'atTheater') ? " until you're at the theater" : " until your booking is confirmed"}.
                </p>
                <p className="text-gray-300 text-sm">
                  {timeFormat(show.movie.runtime)} · {show.movie.genres.map((genre) => genre.name).join(", ")} · {show.movie.ratingBand}
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <MetaChip icon={StarIcon} i={0} tone="amber">
                    {show.movie.vote_average.toFixed(1)} TMDB
                  </MetaChip>
                  {averageRating !== null && (
                    <MetaChip icon={StarIcon} i={1}>
                      {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </MetaChip>
                  )}
                  {show.movie.divergenceBadge && (
                    <MetaChip
                      icon={show.movie.divergenceBadge === "underrated" ? TrendingUpIcon : TrendingDownIcon}
                      i={1.5}
                      tone={show.movie.divergenceBadge === "underrated" ? "cyan" : "violet"}
                    >
                      {show.movie.divergenceBadge === "underrated" ? "Underrated" : "Overhyped"}
                    </MetaChip>
                  )}
                  <MetaChip icon={CalendarIcon} i={2}>{show.movie.release_date.split("-")[0]}</MetaChip>
                  <MetaChip icon={ClockIcon} i={3}>{timeFormat(show.movie.runtime)}</MetaChip>
                  {show.movie.ratingBand && (
                    <MetaChip icon={FilmIcon} i={4}>{show.movie.ratingBand}</MetaChip>
                  )}
                  <MetaChip icon={Volume2Icon} i={5}>Dolby Atmos</MetaChip>
                  <MetaChip icon={MonitorPlayIcon} i={6}>IMAX</MetaChip>
                  {show.movie.hasPostCreditsScene && (
                    <MetaChip icon={FilmIcon} i={7} tone="amber">Stay through the credits</MetaChip>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {show.movie.genres.map((genre) => (
                    <span key={genre.name} className="px-3 py-1 text-xs rounded-full bg-white/[0.06] border border-white/10 text-gray-300 tracking-wide">
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300/90 text-sm leading-relaxed max-w-xl font-light">
                  {show.movie.overview}
                </p>
              </>
            )}

            <div className="flex items-center flex-wrap gap-3 mt-2">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-glow px-9 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/10 flex items-center gap-2"
              >
                <TicketIcon className="w-4.5 h-4.5" />
                Book Tickets
              </motion.button>

              {!isMystery && (
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 text-sm bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-xl transition-colors rounded-full font-medium cursor-pointer"
                >
                  <PlayCircleIcon className="w-5 h-5" />
                  Watch Trailer
                </motion.button>
              )}

              {!isMystery && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleFavorite}
                    className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-xl p-3 rounded-full transition-colors cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${favoriteMovies.find(movie => movie._id === id) ? 'fill-primary text-primary' : ""}`} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    title={isFollowing ? "Unfollow — stop notifications for new shows" : "Follow — get notified when a show is added"}
                    className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-xl px-4 py-3 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isFollowing ? (
                      <BellRingIcon className="w-5 h-5 text-primary fill-primary" />
                    ) : (
                      <BellIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm">{isFollowing ? "Following" : "Notify Me"}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate("/movie-match")}
                    title="Can't agree with friends on what to watch? Start a swipe-to-decide session."
                    className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-xl px-4 py-3 rounded-full transition-colors cursor-pointer"
                  >
                    <ShuffleIcon className="w-5 h-5 text-nebula-cyan" />
                    <span className="text-sm">Start a Movie Match</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* cast carousel */}
        {!isMystery && (
          <RevealSection className="mt-28">
            <p className="section-eyebrow mb-2">The Ensemble</p>
            <p className="text-2xl font-display font-medium">Your Favourite Cast</p>

            <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
              <div className="flex items-center gap-5 w-max px-1">
                {show.movie.casts.map((cast, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center text-center glass-panel glass-panel-hover p-4 w-32 shrink-0"
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/50 to-nebula-violet/50 blur-md opacity-60" />
                      <img
                        src={image_base_url + cast.profile_path}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="relative rounded-full h-16 w-16 aspect-square object-cover border border-white/10"
                      />
                    </div>
                    <p className="font-medium text-xs mt-3 truncate w-full">{cast.name}</p>
                    {cast.character && (
                      <p className="text-[11px] text-gray-500 truncate w-full">{cast.character}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* gallery */}
        {!isMystery && gallery.length > 0 && (
          <RevealSection className="mt-24">
            <p className="section-eyebrow mb-2 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Gallery
            </p>
            <p className="text-2xl font-display font-medium mb-8">Behind The Scenes</p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {gallery.map((path, i) => (
                <motion.button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  whileHover={{ scale: 1.03 }}
                  className="relative shrink-0 w-64 md:w-80 aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
                >
                  <img
                    src={image_base_url + path}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </RevealSection>
        )}

        {/* booking */}
        <div id="booking" className="mt-24 scroll-mt-32">
          <RevealSection>
            <p className="section-eyebrow mb-2">Reserve Your Seats</p>
            <p className="text-2xl font-display font-medium mb-8">Book Tickets</p>

            {theaters.length > 0 && (
              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" /> Select Theater
                </p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {theaters.map((theater) => {
                    const { palette } = getTheaterPresentation(theater);
                    const active = activeTheater?._id === theater._id;
                    return (
                      <motion.button
                        key={theater._id}
                        onClick={() => handleSelectTheater(theater)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative shrink-0 px-5 py-3 rounded-2xl text-left border transition-colors cursor-pointer min-w-48 ${
                          active ? "border-transparent" : "border-white/10 bg-white/[0.04] hover:border-white/25"
                        }`}
                        style={
                          active
                            ? { background: `linear-gradient(120deg, ${palette[0]}33, ${palette[1]}33)`, boxShadow: `0 0 22px -6px ${palette[0]}aa` }
                            : undefined
                        }
                      >
                        <p className="text-sm font-medium truncate">{theater.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{theater.address}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-[280px_1fr] gap-6">
              {/* calendar */}
              <GlassPanel hover={false} className="p-5 h-max">
                <p className="text-sm font-medium mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Choose Date
                </p>
                <div className="flex items-center gap-3">
                  <ChevronLeftIcon className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {dateList.map((date) => {
                      const soldOut = isDateSoldOut(show.dateTime[date]);
                      const isSelected = selectedDate === date;
                      return (
                        <motion.button
                          key={date}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(date)}
                          className={`relative flex flex-col items-center justify-center h-14 rounded-2xl cursor-pointer transition-all duration-300 border ${
                            isSelected
                              ? "bg-primary border-primary text-white shadow-[0_0_25px_-5px_rgba(248,69,101,0.8)]"
                              : "border-white/10 bg-white/[0.04] hover:border-white/25"
                          }`}
                        >
                          <span className="font-medium text-sm">{new Date(date).getDate()}</span>
                          <span className="text-[10px] uppercase tracking-wide">
                            {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          {soldOut && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[7px] font-semibold px-1 py-0.5 rounded">
                              FULL
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-500 shrink-0" />
                </div>

                {selectedDate && isDateSoldOut(show.dateTime[selectedDate] || []) && (
                  <button
                    onClick={() => handleJoinWaitlist(show.dateTime[selectedDate][0].showId)}
                    disabled={joiningShowId !== null}
                    className="mt-4 w-full px-4 py-2.5 text-xs border border-primary/40 text-primary rounded-full hover:bg-primary/10 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {joiningShowId ? "Joining..." : "Sold Out — Join Waitlist"}
                  </button>
                )}
              </GlassPanel>

              {/* showtimes */}
              <GlassPanel hover={false} className="p-5">
                <p className="text-sm font-medium mb-4">
                  Showtimes {activeTheater ? `at ${activeTheater.name}` : ""}
                </p>
                {showtimesForDate.length === 0 ? (
                  <p className="text-gray-400 text-sm">No showtimes available for this date.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {showtimesForDate.map((showtime) => {
                      const badge = seatsLeftBadge(showtime);
                      const price = showtime.computedPrice ?? showtime.showPrice;
                      return (
                        <motion.button
                          key={showtime.showId}
                          onClick={() => handleSelectShowtime(showtime)}
                          whileHover={!showtime.isSoldOut ? { y: -3, scale: 1.02 } : {}}
                          whileTap={!showtime.isSoldOut ? { scale: 0.97 } : {}}
                          disabled={showtime.isSoldOut}
                          className={`relative flex flex-col items-start gap-1.5 px-4 py-3 rounded-2xl border text-left min-w-32 transition-colors ${
                            showtime.isSoldOut
                              ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                              : "border-white/10 bg-white/[0.04] hover:border-primary/50 hover:bg-primary/10 cursor-pointer"
                          }`}
                        >
                          {badge && !showtime.isSoldOut && (
                            <span
                              className={`absolute -top-2 -right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                                badge.tone === "danger"
                                  ? "bg-red-600/90 border-red-400/50 text-white"
                                  : "bg-nebula-amber/90 border-nebula-amber/50 text-void"
                              }`}
                            >
                              {badge.label}
                            </span>
                          )}
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            {isoTimeFormat(showtime.time)}
                            {showtime.isRelaxedScreening && (
                              <HeartHandshakeIcon className="w-3.5 h-3.5 text-nebula-cyan" />
                            )}
                            {showtime.isLiveEvent && (
                              <RadioTowerIcon className="w-3.5 h-3.5 text-nebula-amber" />
                            )}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {showtime.screen?.name || "Screen"} · IMAX
                          </span>
                          {showtime.isLiveEvent && (
                            <span className="text-[10px] text-nebula-amber font-medium">
                              + Live Q&amp;A{showtime.combinedRuntimeMinutes ? ` · ${showtime.combinedRuntimeMinutes}min total` : ""}
                            </span>
                          )}
                          {price != null && (
                            <span className="text-xs text-nebula-cyan font-medium">₹{price}</span>
                          )}
                          {showtime.isSoldOut && (
                            <span className="text-[10px] text-red-400 font-semibold">SOLD OUT</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nebula-amber" /> Fast Filling</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Almost Full</span>
                  <span className="flex items-center gap-1"><HeartHandshakeIcon className="w-3 h-3 text-nebula-cyan" /> Relaxed Screening</span>
                </div>

                {showtimesForDate.some((s) => s.isRelaxedScreening) && (
                  <div className="mt-4 p-4 rounded-2xl border border-nebula-cyan/20 bg-nebula-cyan/[0.04]">
                    <p className="flex items-center gap-2 text-sm font-medium text-nebula-cyan mb-2">
                      <HeartHandshakeIcon className="w-4 h-4" /> What to expect at a Relaxed Screening
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">
                      Showtimes marked with{" "}
                      <HeartHandshakeIcon className="inline w-3 h-3 text-nebula-cyan align-[-1px]" />{" "}
                      have adjusted house conditions for viewers sensitive to full darkness, loud sudden
                      sound, or strict silence rules. In-room adjustments are carried out by theater staff.
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                      {[...new Set(showtimesForDate.flatMap((s) => s.accommodations || []))].map((value) => (
                        <li key={value}>{ACCOMMODATION_LABELS[value] || value}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {showtimesForDate.some((s) => s.isLiveEvent) && (
                  <div className="mt-4 p-4 rounded-2xl border border-nebula-amber/20 bg-nebula-amber/[0.04]">
                    <p className="flex items-center gap-2 text-sm font-medium text-nebula-amber mb-2">
                      <RadioTowerIcon className="w-4 h-4" /> Live Q&amp;A Event
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Showtimes marked with{" "}
                      <RadioTowerIcon className="inline w-3 h-3 text-nebula-amber align-[-1px]" />{" "}
                      include a live simulcast segment (Q&amp;A, intro, or similar) right after the film,
                      streamed into the theater at the same time as every other participating theater.
                      One ticket covers both the film and the live segment.
                      {showtimesForDate.find((s) => s.isLiveEvent)?.combinedRuntimeMinutes && (
                        <> Combined runtime: {showtimesForDate.find((s) => s.isLiveEvent).combinedRuntimeMinutes} minutes.</>
                      )}
                    </p>
                  </div>
                )}
              </GlassPanel>
            </div>
          </RevealSection>
        </div>

        {!isMystery && (
          <RevealSection className="mt-24">
            <p className="section-eyebrow mb-2">Word Of Mouth</p>
            <p className="text-2xl font-display font-medium mb-8">Ratings &amp; Reviews</p>

            {reviews.length > 0 && (
              <GlassPanel hover={false} className="p-6 mb-8 max-w-2xl flex items-center gap-8 flex-wrap">
                <div className="flex flex-col items-center">
                  <p className="text-4xl font-display font-medium">{(averageRating ?? 0).toFixed(1)}</p>
                  <RatingStars value={Math.round(averageRating ?? 0)} size="sm" />
                  <p className="text-xs text-gray-500 mt-1">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <ThumbsUpIcon className="w-5 h-5 text-nebula-cyan" />
                  <span>
                    {Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)}% recommend this movie
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <UsersIcon className="w-5 h-5 text-nebula-violet" />
                  <span>{reviewCount} moviegoers rated this</span>
                </div>
              </GlassPanel>
            )}

            <EmotionalBreakdown breakdown={emotionalBreakdown} total={emotionalTotal} />

            {user && (
              <div className="max-w-xl glass-panel p-5 mb-8">
                <p className="text-sm font-medium mb-3">
                  {myReview ? "Edit your review" : "Rate this movie"}
                </p>
                <RatingStars value={reviewRating} onChange={setReviewRating} size="lg" className="mb-3" />
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts (optional)"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-400 cursor-pointer w-max">
                  <input
                    type="checkbox"
                    checked={reviewSpoiler}
                    onChange={(e) => setReviewSpoiler(e.target.checked)}
                    className="cursor-pointer"
                  />
                  This review contains spoilers
                </label>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="mt-3 px-6 py-2.5 text-sm bg-primary hover:bg-primary-dull transition-colors rounded-full font-medium cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
                </motion.button>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm mb-8">No reviews yet.</p>
            ) : (
              <div className="max-w-xl flex flex-col gap-4 mb-8">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    spoilerSafeMode={spoilerSafeMode}
                    hasWatched={hasWatched}
                  />
                ))}
              </div>
            )}
          </RevealSection>
        )}

        {similarMovies.length > 0 && (
          <RevealSection className="mt-16">
            <p className="section-eyebrow mb-2">More Like This</p>
            <p className="text-2xl font-display font-medium mb-8">
              Because You Watched {show.movie.title}
            </p>
            <div className="flex flex-wrap max-sm:justify-center gap-8">
              {similarMovies.map((movie, i) => (
                <FlyInCard key={movie._id} index={i}>
                  <MovieCard movie={movie} />
                </FlyInCard>
              ))}
            </div>
          </RevealSection>
        )}

        <div className="flex justify-center mt-20 pb-4">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {navigate("/movies") ; scrollTo(0, 0)}}
            className="btn-glow px-10 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10"
          >
            Show More
          </motion.button>
        </div>
      </div>

      <TrailerModal open={trailerOpen} onClose={() => setTrailerOpen(false)} videoUrl={dummyTrailers[0].videoUrl} />

      {/* gallery lightbox */}
      <AnimatePresence>
        {galleryIndex !== null && gallery[galleryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
            onClick={() => setGalleryIndex(null)}
          >
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={image_base_url + gallery[galleryIndex]}
              alt=""
              className="max-w-4xl w-full rounded-2xl border border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieDetails;
