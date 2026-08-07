import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, HeartIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";

const NAME_STORAGE_PREFIX = "movie-match-name-";

const MatchSessionSwipe = () => {
  const { sessionId } = useParams();
  const { axios, image_base_url } = useAppContext();

  const [name, setName] = useState(() => localStorage.getItem(NAME_STORAGE_PREFIX + sessionId) || "");
  const [joining, setJoining] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [swipedIds, setSwipedIds] = useState([]);
  const [movieById, setMovieById] = useState({});
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState(0);

  const fetchStatusAndJoin = async (trimmedName) => {
    setJoining(true);
    try {
      const { data } = await axios.get(`/api/match-session/${sessionId}/status`);
      if (!data.success) return toast.error(data.message);

      setMovieById(Object.fromEntries(data.candidates.map((c) => [c.movieId, c])));

      const { data: joinData } = await axios.post(`/api/match-session/${sessionId}/join`, { name: trimmedName });
      if (!joinData.success) return toast.error(joinData.message);

      localStorage.setItem(NAME_STORAGE_PREFIX + sessionId, trimmedName);
      setCandidates(joinData.candidateMovieIds);
      setSwipedIds(joinData.swipedMovieIds);
      setFinished(joinData.swipedMovieIds.length >= joinData.candidateMovieIds.length);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setJoining(false);
    setLoading(false);
  };

  const handleJoin = () => {
    if (!name.trim()) return toast.error("Enter your name to join");
    fetchStatusAndJoin(name.trim());
  };

  const remaining = candidates ? candidates.filter((id) => !swipedIds.includes(id)) : [];
  const currentMovieId = remaining[0];
  const currentMovie = currentMovieId ? movieById[currentMovieId] : null;

  const swipe = async (yes) => {
    if (!currentMovieId) return;
    setDirection(yes ? 1 : -1);
    try {
      const { data } = await axios.post(`/api/match-session/${sessionId}/swipe`, {
        name: name.trim(),
        movieId: currentMovieId,
        yes,
      });
      if (!data.success) return toast.error(data.message);

      const nextSwiped = [...swipedIds, currentMovieId];
      setSwipedIds(nextSwiped);
      if (nextSwiped.length >= candidates.length) setFinished(true);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (loading && !joining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <BlurCircle top="-100px" left="-100px" />
        <h1 className="text-2xl font-semibold mb-2">Movie Match</h1>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
          Swipe yes or no on tonight's options — enter your name to start.
        </p>
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50 rounded"
          >
            {joining ? "Joining..." : "Start Swiping"}
          </button>
        </div>
      </div>
    );
  }

  if (joining) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Movie Match</h1>
      <p className="text-sm text-gray-300 mb-6">
        {swipedIds.length}/{candidates.length} swiped
      </p>

      {finished ? (
        <div className="w-full max-w-sm bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
          <p className="text-lg font-medium mb-2">You're all done!</p>
          <p className="text-sm text-gray-300">
            Waiting on everyone else to finish swiping. The host will see the result once everyone's in.
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm h-[420px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentMovie && (
              <motion.div
                key={currentMovie.movieId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                exit={{
                  opacity: 0,
                  x: direction >= 0 ? 300 : -300,
                  rotate: direction >= 0 ? 15 : -15,
                }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 rounded-xl overflow-hidden border border-primary/20 bg-primary/5 flex flex-col"
              >
                <img
                  src={image_base_url + currentMovie.poster_path}
                  alt={currentMovie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-lg font-semibold">{currentMovie.title}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!finished && currentMovie && (
        <div className="flex items-center gap-8 mt-6">
          <button
            onClick={() => swipe(false)}
            className="p-4 rounded-full bg-red-500/20 border border-red-500/40 cursor-pointer active:scale-90 transition"
          >
            <XIcon className="w-7 h-7 text-red-400" />
          </button>
          <button
            onClick={() => swipe(true)}
            className="p-4 rounded-full bg-green-500/20 border border-green-500/40 cursor-pointer active:scale-90 transition"
          >
            <HeartIcon className="w-7 h-7 text-green-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchSessionSwipe;
