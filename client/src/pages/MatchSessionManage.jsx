import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import ShareLinkPanel from "../components/ShareLinkPanel";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";
import { setMatchHandoff } from "../lib/matchHandoff";

const POLL_INTERVAL_MS = 6000;

const MatchSessionManage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const shareUrl = `${window.location.origin}/movie-match/${sessionId}`;

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/match-session/${sessionId}/status`);
      if (!isCancelled() && data.success) setStatus(data);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { enabled: Boolean(user), deps: [sessionId, user, axios] });

  const closeSession = async () => {
    setClosing(true);
    try {
      const { data } = await axios.post(
        `/api/match-session/${sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.matchedMovieId ? "Everyone agreed!" : "No full match — here's the closest one.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setClosing(false);
  };

  const handoffToShowtimePoll = (movieId) => {
    if (status?.joinedCount) {
      setMatchHandoff(status);
    }
    navigate(`/movies/${movieId}/showtime-poll`);
  };

  const handoffToGroupBooking = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Please sign in to manage your Movie Match session.
      </div>
    );
  }

  if (loading) return <Loading />;
  if (!status) return null;

  const ranked = [...status.candidates].sort((a, b) => b.yesCount - a.yesCount);
  const allFinished = status.finishedCount >= status.joinedCount && status.joinedCount > 0;

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Movie Match — Dashboard</h1>
      <p className="text-sm text-gray-300 mb-6">
        {status.finishedCount}/{status.joinedCount || status.invitedCount} finished swiping
        {status.joinedCount < status.invitedCount && ` · ${status.joinedCount}/${status.invitedCount} joined`}
      </p>

      <ShareLinkPanel shareUrl={shareUrl} />

      {status.status === "closed" && (
        <div className="w-full max-w-md rounded-lg p-4 text-sm mb-6 border bg-green-950/30 border-green-500/40">
          {status.matchedMovieId ? (
            <>
              <p className="mb-3 font-medium">
                Everyone agreed on {status.candidates.find((c) => c.movieId === status.matchedMovieId)?.title}!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handoffToShowtimePoll(status.matchedMovieId)}
                  className="px-4 py-2 bg-primary rounded text-xs cursor-pointer"
                >
                  Start Squad Sync Poll
                </button>
                <button
                  onClick={() => handoffToGroupBooking(status.matchedMovieId)}
                  className="px-4 py-2 bg-primary/20 border border-primary/40 rounded text-xs cursor-pointer"
                >
                  Go to Group Booking
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3">
                No full match — here's the closest one, ranked by yes-count:
              </p>
              <div className="flex flex-col gap-2">
                {ranked.slice(0, 3).map((c) => (
                  <div key={c.movieId} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
                    <span className="text-xs">{c.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{c.yesCount} yes</span>
                      <button
                        onClick={() => handoffToShowtimePoll(c.movieId)}
                        className="px-3 py-1 bg-primary rounded text-xs cursor-pointer"
                      >
                        Poll this one
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {status.status === "expired" && (
        <div className="w-full max-w-md bg-yellow-950/30 border border-yellow-500/40 rounded-lg p-4 text-sm mb-6">
          This session expired before everyone finished swiping.
        </div>
      )}

      <div className="w-full max-w-md space-y-2 mb-8">
        {ranked.map((c) => (
          <div
            key={c.movieId}
            className="flex items-center justify-between px-4 py-3 rounded-lg border bg-primary/5 border-primary/20"
          >
            <p className="text-sm font-medium">{c.title}</p>
            <span className="text-sm text-gray-300">{c.yesCount} yes</span>
          </div>
        ))}
      </div>

      {status.status === "active" && (
        <button
          onClick={closeSession}
          disabled={closing || !allFinished}
          className="px-6 py-2 bg-primary rounded text-sm cursor-pointer disabled:opacity-50"
          title={!allFinished ? "Waiting on everyone to finish swiping" : undefined}
        >
          Close Session Now
        </button>
      )}
    </div>
  );
};

export default MatchSessionManage;
