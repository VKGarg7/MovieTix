import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FilmIcon, CheckCircleIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";

const TrailerVoteWidget = ({ showId }) => {
  const { axios, getToken } = useAppContext();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const load = async () => {
    try {
      const { data } = await axios.get(`/api/trailer-vote/${showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setState(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);

  const vote = async (choice) => {
    setVoting(true);
    try {
      const { data } = await axios.post(
        `/api/trailer-vote/${showId}/vote`,
        { choice },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setState(data);
        toast.success("Vote recorded!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record vote");
    }
    setVoting(false);
  };

  if (loading || !state) return null;

  const { candidates, totalVotes, myVote, hasEnoughVotes, winner } = state;

  return (
    <div className="mb-3 max-w-sm">
      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
        <FilmIcon className="w-3.5 h-3.5" />
        Vote for the pre-show trailer
      </p>

      <div className="flex flex-col gap-1.5">
        {candidates.map((c) => {
          const isMine = myVote === c.movieId;
          const isWinner = hasEnoughVotes && winner?.movieId === c.movieId;
          return (
            <button
              key={c.movieId}
              onClick={() => vote(c.movieId)}
              disabled={voting}
              className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-lg border cursor-pointer disabled:opacity-50 transition-colors ${
                isMine ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-gray-300 hover:border-white/25"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                {isMine && <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />}
                {c.title}
                {isWinner && <span className="text-nebula-amber">👑</span>}
              </span>
              <span className="text-gray-500 shrink-0 ml-2">{c.votes}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-500 mt-1.5">
        {hasEnoughVotes
          ? `Winner: ${winner.title} (${totalVotes} votes)`
          : `Not enough votes yet (${totalVotes} so far) — check back closer to showtime.`}
      </p>
    </div>
  );
};

export default TrailerVoteWidget;
