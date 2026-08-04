import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { StarIcon, Heart, PlayCircleIcon, BellIcon, BellRingIcon, EyeOffIcon, FilmIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/useAppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);

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

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {isMystery ? (
          <div className="max-md:mx-auto rounded-xl h-104 max-w-70 w-70 bg-gradient-to-br from-primary/30 to-gray-900 flex flex-col items-center justify-center gap-3">
            <EyeOffIcon className="w-14 h-14 text-primary" />
            <p className="font-medium">Mystery Movie</p>
          </div>
        ) : (
          <img
            src={image_base_url + show.movie.poster_path}
            alt=""
            className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
          />
        )}

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary">ENGLISH</p>

          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {isMystery ? "Mystery Movie" : show.movie.title}
          </h1>

          {isMystery ? (
            <>
              <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
                Only the genre, runtime and rating band are revealed before you book —
                the title stays a surprise{show.dateTime && Object.values(show.dateTime).flat().some(s => s.mysteryRevealAt === 'atTheater') ? " until you're at the theater" : " until your booking is confirmed"}.
              </p>
              <p>
                {timeFormat(show.movie.runtime)} |{" "}
                {show.movie.genres.map((genre) => genre.name).join(" ,")} |{" "}
                {show.movie.ratingBand}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-gray-300">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-primary fill-primary" />
                  {show.movie.vote_average.toFixed(1)} TMDB Rating
                </div>
                {averageRating !== null && (
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </div>
                )}
                {show.movie.hasPostCreditsScene && (
                  <div className="flex items-center gap-2 text-primary text-sm" title="This movie has a scene after the credits">
                    <FilmIcon className="w-4 h-4" />
                    Stay through the credits
                  </div>
                )}
              </div>

              <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
                {show.movie.overview}
              </p>

              <p>
                {timeFormat(show.movie.runtime)} |{" "}
                {show.movie.genres.map((genre) => genre.name).join(" ,")} |{" "}
                {show.movie.release_date.split("-")[0]}
              </p>
            </>
          )}

          <div className="flex items-center flex-wrap gap-4 mt-4">
            {!isMystery && (
              <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover::bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
                <PlayCircleIcon className="w-5 h-5" />
                Watch Trailer
              </button>
            )}
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95">
              Buy Tickets
            </a>

            {!isMystery && (
              <>
                <button onClick={handleFavorite} className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95">
                  <Heart className={`w-5 h-5 ${favoriteMovies.find(movie => movie._id === id) ? 'fill-primary text-primary' : ""}`} />
                </button>

                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  title={isFollowing ? "Unfollow — stop notifications for new shows" : "Follow — get notified when a show is added"}
                  className="flex items-center gap-2 bg-gray-700 px-4 py-2.5 rounded-full transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isFollowing ? (
                    <BellRingIcon className="w-5 h-5 text-primary fill-primary" />
                  ) : (
                    <BellIcon className="w-5 h-5" />
                  )}
                  <span className="text-sm">{isFollowing ? "Following" : "Notify Me"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {!isMystery && (
        <>
          <p className="text-lg font-medium mt-20">Your Favourite Cast</p>

          <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
            <div className="flex items-center gap-4 w-max px-4">
              {show.movie.casts.slice(0, 12).map((cast, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <img
                    src={image_base_url + cast.profile_path}
                    alt=""
                    className="rounded-full h-20 md:h-20 aspect-square object-cover"
                  />
                  <p className="font-medium text-xs mt-3">{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <DateSelect dateTime={show.dateTime} id={id} />

      {!isMystery && (
        <>
      <p className="text-lg font-medium mt-20 mb-4">Ratings & Reviews</p>

      {user && (
        <div className="max-w-xl bg-gray-800/40 rounded-lg p-4 mb-8">
          <p className="text-sm font-medium mb-2">
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
                  className={`w-6 h-6 ${
                    star <= reviewRating ? "text-primary fill-primary" : "text-gray-500"
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
            className="w-full bg-gray-900/60 border border-gray-700 rounded-md p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
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
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="mt-3 px-6 py-2 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer disabled:opacity-50"
          >
            {submittingReview ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
          </button>
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
              <div key={review._id} className="border-b border-gray-700 pb-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{review.user?.name || "Anonymous"}</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating ? "text-primary fill-primary" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  {review.spoiler && (
                    <span className="text-[10px] font-semibold text-yellow-400 border border-yellow-400/50 rounded px-1">
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
                      className="text-gray-500 text-sm mt-1 italic cursor-pointer hover:text-gray-400 transition"
                    >
                      Spoiler hidden — click to reveal
                    </button>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">{review.text}</p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {similarMovies.length > 0 && (
        <>
          <p className="text-lg font-medium mt-4 mb-8">You might also like</p>
          <div className="flex flex-wrap max-sm:justify-center gap-8">
            {similarMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center mt-20">
        <button
          onClick={() => {navigate("/movies") ; scrollTo(0, 0)}}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
