import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 6000;
const NAME_STORAGE_PREFIX = "squad-sync-name-";

const ShowtimePollVote = () => {
  const { pollId } = useParams();
  const { axios } = useAppContext();

  const [pollStatus, setPollStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem(NAME_STORAGE_PREFIX + pollId) || "");
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/showtime-poll/${pollId}/status`);
      if (!isCancelled() && data.success) setPollStatus(data);
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { deps: [pollId, axios] });

  const submitVote = async () => {
    if (!name.trim()) return toast.error("Enter your name to vote");
    if (!selectedShowId) return toast.error("Pick a showtime to vote for");

    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/showtime-poll/${pollId}/vote`, {
        name: name.trim(),
        showId: selectedShowId,
      });
      if (data.success) {
        localStorage.setItem(NAME_STORAGE_PREFIX + pollId, name.trim());
        toast.success("Vote recorded!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  if (loading) return <Loading />;

  if (!pollStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Poll not found.
      </div>
    );
  }

  const isActive = pollStatus.status === "active";
  const myVote = pollStatus.candidates.find((c) =>
    selectedShowId ? c.showId === selectedShowId : false
  );

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Squad Sync</h1>
      {pollStatus.organizerNote && (
        <p className="text-gray-400 text-sm mb-2 text-center max-w-md">{pollStatus.organizerNote}</p>
      )}
      <p className="text-sm text-gray-300 mb-6">
        {pollStatus.votedCount}/{pollStatus.invitedCount} voted &middot; needs {pollStatus.quorumCount} to close
      </p>

      {pollStatus.status === "closed" && (
        <div className="w-full max-w-md bg-green-950/30 border border-green-500/40 rounded-lg p-4 text-sm text-center mb-6">
          <p className="mb-2 font-medium">The votes are in!</p>
          <p className="text-gray-300">
            {pollStatus.candidates.find((c) => c.showId === pollStatus.winningShow)?.movieTitle} won.
            A group booking has been created — the organizer will share the join link.
          </p>
        </div>
      )}

      {pollStatus.status === "expired" && (
        <div className="w-full max-w-md bg-yellow-950/30 border border-yellow-500/40 rounded-lg p-4 text-sm text-center mb-6">
          This poll expired without a clear winner. Waiting on the organizer to break the tie.
        </div>
      )}

      <div className="w-full max-w-md space-y-2 mb-6">
        {pollStatus.candidates.map((c) => (
          <div
            key={c.showId}
            onClick={() => isActive && !c.removed && setSelectedShowId(c.showId)}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition
              ${c.removed ? "opacity-40" : "cursor-pointer"}
              ${selectedShowId === c.showId ? "bg-primary/20 border-primary" : "bg-primary/5 border-primary/20 hover:bg-primary/10"}`}
          >
            <div>
              <p className="text-sm font-medium">{c.movieTitle}</p>
              <p className="text-xs text-gray-400">
                {new Date(c.showDateTime).toLocaleString()} &middot; {c.theater}
              </p>
              {c.removed && <p className="text-xs text-red-400 mt-1">Sold out — no longer an option</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">{c.votes} vote{c.votes === 1 ? "" : "s"}</span>
              {selectedShowId === c.showId && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </div>
          </div>
        ))}
      </div>

      {isActive && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={submitVote}
            disabled={submitting || !selectedShowId}
            className="w-full px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50 rounded"
          >
            {myVote ? "Update Vote" : "Vote"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShowtimePollVote;
