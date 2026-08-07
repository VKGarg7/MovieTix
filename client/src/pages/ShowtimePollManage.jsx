import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import ShareLinkPanel from "../components/ShareLinkPanel";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 6000;

const ShowtimePollManage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [pollStatus, setPollStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [tieBreakId, setTieBreakId] = useState(null);

  const shareUrl = `${window.location.origin}/showtime-poll/${pollId}`;

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/showtime-poll/${pollId}/status`);
      if (!isCancelled() && data.success) setPollStatus(data);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { enabled: Boolean(user), deps: [pollId, user, axios] });

  const closePoll = async (winningShowId) => {
    setClosing(true);
    try {
      const { data } = await axios.post(
        `/api/showtime-poll/${pollId}/close`,
        winningShowId ? { winningShowId } : {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Poll closed — group booking created!");
        navigate(`/group-booking/${data.groupId}/manage`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setClosing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Please sign in to manage your poll.
      </div>
    );
  }

  if (loading) return <Loading />;
  if (!pollStatus) return null;

  const activeCandidates = pollStatus.candidates.filter((c) => !c.removed);
  const sorted = [...activeCandidates].sort((a, b) => b.votes - a.votes);
  const isTie = sorted.length > 1 && sorted[0].votes === sorted[1].votes && sorted[0].votes > 0;

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Squad Sync — Poll Dashboard</h1>
      <p className="text-sm text-gray-300 mb-6">
        {pollStatus.votedCount}/{pollStatus.invitedCount} voted &middot; needs {pollStatus.quorumCount} to auto-close
      </p>

      <ShareLinkPanel shareUrl={shareUrl} />

      {pollStatus.status === "closed" && (
        <div className="w-full max-w-md bg-green-950/30 border border-green-500/40 rounded-lg p-4 text-sm mb-6">
          Poll closed. Winning show: {pollStatus.candidates.find((c) => c.showId === pollStatus.winningShow)?.movieTitle}.{" "}
          <a href={`/group-booking/${pollStatus.resultingGroupBookingId}/manage`} className="text-primary underline">
            Manage the group booking
          </a>
        </div>
      )}

      <div className="w-full max-w-md space-y-2 mb-8">
        {pollStatus.candidates.map((c) => (
          <div
            key={c.showId}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border bg-primary/5 border-primary/20 ${c.removed ? "opacity-40" : ""}`}
          >
            <div>
              <p className="text-sm font-medium">{c.movieTitle}</p>
              <p className="text-xs text-gray-400">
                {new Date(c.showDateTime).toLocaleString()} &middot; {c.theater}
              </p>
              {c.removed && <p className="text-xs text-red-400 mt-1">Sold out — removed</p>}
            </div>
            <span className="text-sm text-gray-300">{c.votes} vote{c.votes === 1 ? "" : "s"}</span>
          </div>
        ))}
      </div>

      {pollStatus.status === "active" && (
        <div className="w-full max-w-md">
          {isTie ? (
            <div className="bg-yellow-950/30 border border-yellow-500/40 rounded-lg p-4 text-sm">
              <p className="mb-3">Votes are tied — pick the winner to close the poll:</p>
              <div className="flex flex-col gap-2">
                {sorted
                  .filter((c) => c.votes === sorted[0].votes)
                  .map((c) => (
                    <button
                      key={c.showId}
                      onClick={() => setTieBreakId(c.showId)}
                      className={`px-4 py-2 rounded text-left text-sm cursor-pointer border
                        ${tieBreakId === c.showId ? "bg-primary/30 border-primary" : "bg-black/20 border-primary/20"}`}
                    >
                      {c.movieTitle} &middot; {new Date(c.showDateTime).toLocaleString()}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => closePoll(tieBreakId)}
                disabled={closing || !tieBreakId}
                className="mt-4 px-6 py-2 bg-primary rounded text-sm cursor-pointer disabled:opacity-50"
              >
                Break Tie &amp; Close Poll
              </button>
            </div>
          ) : (
            <button
              onClick={() => closePoll()}
              disabled={closing || activeCandidates.length === 0}
              className="px-6 py-2 bg-primary rounded text-sm cursor-pointer disabled:opacity-50"
            >
              Close Poll Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowtimePollManage;
