import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRightIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";
import PillOptionSelector from "../components/PillOptionSelector";

const MatchSessionCreate = () => {
  const navigate = useNavigate();
  const { axios, getToken, user, selectedTheater } = useAppContext();

  const [invitedCount, setInvitedCount] = useState(3);
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [organizerNote, setOrganizerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createSession = async () => {
    if (!user) return toast.error("Please login to start a Movie Match session");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/match-session/create",
        {
          theaterId: selectedTheater?._id,
          invitedCount,
          expiresInHours,
          organizerNote,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        navigate(`/movie-match/${data.sessionId}/manage`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Movie Match — Swipe to Decide</h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
        Candidates default to what's currently showing at {selectedTheater?.name || "your theater"}.
        Everyone swipes yes/no, and we'll surface the movie you all agreed on.
      </p>

      <div className="w-full max-w-lg">
        <label className="block text-gray-400 text-sm mb-1">How many friends are joining?</label>
        <div className="mb-8">
          <PillOptionSelector
            options={[2, 3, 4, 5, 6, 8]}
            value={invitedCount}
            onChange={setInvitedCount}
          />
        </div>

        <label className="block text-gray-400 text-sm mb-1">Session open for</label>
        <div className="mb-8">
          <PillOptionSelector
            options={[12, 24, 48, 72, 168]}
            value={expiresInHours}
            onChange={setExpiresInHours}
            renderLabel={(hours) => (hours >= 168 ? "1w" : `${hours}h`)}
          />
        </div>

        <label className="block text-gray-400 text-sm mb-1">
          Note for your friends (optional)
        </label>
        <input
          type="text"
          value={organizerNote}
          onChange={(e) => setOrganizerNote(e.target.value)}
          placeholder="e.g. Swipe before Friday!"
          className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none mb-8"
        />

        <button
          onClick={createSession}
          disabled={submitting}
          className="flex items-center gap-1 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50 mx-auto"
        >
          Start Match &amp; Get Share Link
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MatchSessionCreate;
