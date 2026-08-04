import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRightIcon, PlusIcon, XIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";
import PillOptionSelector from "../components/PillOptionSelector";

const MIN_CANDIDATES = 2;
const MAX_CANDIDATES = 4;

const ShowtimePollCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, user, fetchShowDetails } = useAppContext();

  const [show, setShow] = useState(null);
  const [selectedShowIds, setSelectedShowIds] = useState([]);
  const [inviteeNames, setInviteeNames] = useState(["", ""]);
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [organizerNote, setOrganizerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getShow = async () => {
      const data = await fetchShowDetails(id);
      if (data) setShow(data);
    };
    getShow();
  }, [id, fetchShowDetails]);

  const allOptions = show
    ? Object.values(show.dateTime).flat().sort((a, b) => new Date(a.time) - new Date(b.time))
    : [];

  const toggleCandidate = (showId) => {
    setSelectedShowIds((prev) => {
      if (prev.includes(showId)) return prev.filter((id) => id !== showId);
      if (prev.length >= MAX_CANDIDATES) {
        toast(`You can only poll up to ${MAX_CANDIDATES} candidate shows`);
        return prev;
      }
      return [...prev, showId];
    });
  };

  const updateInviteeName = (index, value) => {
    setInviteeNames((prev) => prev.map((name, i) => (i === index ? value : name)));
  };

  const addInviteeField = () => setInviteeNames((prev) => [...prev, ""]);
  const removeInviteeField = (index) =>
    setInviteeNames((prev) => prev.filter((_, i) => i !== index));

  const createPoll = async () => {
    if (!user) return toast.error("Please login to start a poll");
    if (selectedShowIds.length < MIN_CANDIDATES) {
      return toast.error(`Select at least ${MIN_CANDIDATES} candidate shows`);
    }
    const names = inviteeNames.map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return toast.error("Add at least one invitee name");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/showtime-poll/create",
        { showIds: selectedShowIds, inviteeNames: names, expiresInHours, organizerNote },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        navigate(`/showtime-poll/${data.pollId}/manage`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  if (!show) return <Loading />;

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Squad Sync — Poll a Showtime</h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
        Pick 2-4 candidate showtimes for {show.movie?.title}, share the poll, and let your friends
        vote before you commit to a booking.
      </p>

      <div className="w-full max-w-lg">
        <p className="text-sm text-gray-300 mb-2">
          Candidate shows ({selectedShowIds.length}/{MAX_CANDIDATES})
        </p>
        <div className="space-y-2 mb-8">
          {allOptions.map((option) => {
            const selected = selectedShowIds.includes(option.showId);
            return (
              <div
                key={option.showId}
                onClick={() => toggleCandidate(option.showId)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition
                  ${selected ? "bg-primary/20 border-primary" : "bg-primary/5 border-primary/20 hover:bg-primary/10"}
                  ${option.isSoldOut ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium">{new Date(option.time).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{option.screen?.theater?.name}</p>
                </div>
                {option.isSoldOut ? (
                  <span className="text-xs text-red-400">Sold out</span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {option.occupiedCount}/{option.totalCapacity} taken
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-300 mb-2">Invitees</p>
        <div className="space-y-2 mb-2">
          {inviteeNames.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => updateInviteeName(index, e.target.value)}
                placeholder={`Friend ${index + 1}`}
                className="flex-1 bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
              />
              {inviteeNames.length > 1 && (
                <button onClick={() => removeInviteeField(index)} className="p-2 cursor-pointer">
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addInviteeField}
          className="flex items-center gap-1 text-xs text-primary mb-8 cursor-pointer"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add another invitee
        </button>

        <label className="block text-gray-400 text-sm mb-1">Poll open for</label>
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
          placeholder="e.g. Vote before Friday!"
          className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none mb-8"
        />

        <button
          onClick={createPoll}
          disabled={submitting}
          className="flex items-center gap-1 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50 mx-auto"
        >
          Create Poll &amp; Get Share Link
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ShowtimePollCreate;
