import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import timeFormat from "../lib/timeFormat";
import { StarIcon, Heart, PlayCircleIcon, BellIcon, BellRingIcon, EyeOffIcon, FilmIcon, CalendarIcon, ClockIcon } from "lucide-react";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import AnimatedTitle from "../components/cinematic/AnimatedTitle";
import RevealSection from "../components/cinematic/RevealSection";
import FlyInCard from "../components/cinematic/FlyInCard";
import TrailerModal from "../components/cinematic/TrailerModal";
import { dummyTrailers } from "../assets/assets";
import { useAppContext } from "../context/useAppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const {axios , getToken , user , fetchFavoriteMovies , favoriteMovies , image_base_url , selectedTheater , fetchShowDetails, spoilerSafeMode} = useAppContext();

  const [similarMovies, setSimilarMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [revealedReviewIds, setRevealedReviewIds] = useState(new Set());

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, 260]);
  const bgScale = useTransform(scrollY, [0, 900], [1, 1.15]);
  const bgOpacity = useTransform(scrollY, [0, 700], [0.55, 0]);

  const getShow = async () => {
    const data = await fetchShowDetails(id, selectedTheater?._id);
    if (data) {
      setShow(data);
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
      if(!user) return toast.error("Please login to add to favorites");
      const {data} = await axios.post('api/user/update-favorite', {movieId: id}, {headers: {Authorization: `Bearer ${await getToken()}`}});

      if(data.success){
        await fetchFavoriteMovies();
        toast.success(data.message);
      }

    } catch (error) {
      console.log(error);
    }
  }


  useEffect(() => {
    getShow();
    getReviews();
    getSimilarMovies();
    // re-run when the movie id or selected theater changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedTheater]);

  useEffect(() => {
    getMyReview();
    getFollowStatus();
    getWatchedStatus();
    // re-run when the movie id or signed-in user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const isMystery = show?.movie?.isMysteryMovie;

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

      <div className="px-6 md:px-16 lg:px-40 pt-36 md:pt-52">
        <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto items-start">
          {isMystery ? (
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="max-md:mx-auto glass-panel h-104 max-w-70 w-70 bg-gradient-to-br from-primary/30 to-void flex flex-col items-center justify-center gap-3 shrink-0"
              style={{ transformPerspective: 1000 }}
            >
              <EyeOffIcon className="w-14 h-14 text-primary" />
              <p className="font-medium">Mystery Movie</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="max-md:mx-auto relative shrink-0"
              style={{ transformPerspective: 1000 }}
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
              English · Now Screening
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
                <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-gray-300 text-sm">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-4.5 h-4.5 text-nebula-amber fill-nebula-amber" />
                    {show.movie.vote_average.toFixed(1)} TMDB
                  </div>
                  {averageRating !== null && (
                    <div className="flex items-center gap-2">
                      <StarIcon className="w-4.5 h-4.5 text-primary fill-primary" />
                      {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> {show.movie.release_date.split("-")[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" /> {timeFormat(show.movie.runtime)}
                  </div>
                  {show.movie.hasPostCreditsScene && (
                    <div className="flex items-center gap-2 text-primary" title="This movie has a scene after the credits">
                      <FilmIcon className="w-4 h-4" />
                      Stay through the credits
                    </div>
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
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { navigate(`/book/${id}`); scrollTo(0, 0); }}
                className="btn-glow px-9 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/10"
              >
                Buy Tickets
              </motion.button>

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
                </>
              )}
            </div>
          </div>
        </div>

        {/* cast */}
        {!isMystery && (
          <RevealSection className="mt-28">
            <p className="section-eyebrow mb-2">The Ensemble</p>
            <p className="text-2xl font-display font-medium">Your Favourite Cast</p>

            <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
              <div className="flex items-center gap-5 w-max px-1">
                {show.movie.casts.slice(0, 12).map((cast, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center text-center glass-panel glass-panel-hover p-4 w-28"
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
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        <div className="mt-20">
          <DateSelect dateTime={show.dateTime} id={id} />
        </div>

        {!isMystery && (
          <RevealSection className="mt-24">
            <p className="section-eyebrow mb-2">Word Of Mouth</p>
            <p className="text-2xl font-display font-medium mb-8">Ratings &amp; Reviews</p>

            {user && (
              <div className="max-w-xl glass-panel p-5 mb-8">
                <p className="text-sm font-medium mb-3">
                  {myReview ? "Edit your review" : "Rate this movie"}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <StarIcon
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating ? "text-primary fill-primary" : "text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
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
                {reviews.map((review) => {
                  const isCollapsed = review.spoiler
                    && spoilerSafeMode
                    && !hasWatched
                    && !revealedReviewIds.has(review._id);

                  return (
                    <div key={review._id} className="glass-panel p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{review.user?.name || "Anonymous"}</p>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating ? "text-primary fill-primary" : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        {review.spoiler && (
                          <span className="text-[10px] font-semibold text-nebula-amber border border-nebula-amber/50 rounded px-1.5 py-0.5">
                            SPOILER
                          </span>
                        )}
                      </div>
                      {review.text && (
                        isCollapsed ? (
                          <button
                            onClick={() => {
                              if (window.confirm("This review contains spoilers. Reveal it anyway?")) {
                                setRevealedReviewIds((prev) => new Set(prev).add(review._id));
                              }
                            }}
                            className="text-gray-400 text-sm mt-2 italic cursor-pointer hover:text-gray-300 transition-colors"
                          >
                            Spoiler hidden — click to reveal
                          </button>
                        ) : (
                          <p className="text-gray-400 text-sm mt-2 font-light">{review.text}</p>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </RevealSection>
        )}

        {similarMovies.length > 0 && (
          <RevealSection className="mt-16">
            <p className="section-eyebrow mb-2">More Like This</p>
            <p className="text-2xl font-display font-medium mb-8">You Might Also Like</p>
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
    </div>
  );
};

export default MovieDetails;
