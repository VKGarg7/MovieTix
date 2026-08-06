import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ClapperboardIcon, XIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import PageHeader from "../components/cinematic/PageHeader";
import EmptyState from "../components/admin/EmptyState";
import { useAppContext } from "../context/useAppContext";

const CommunityScreeningBrowse = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModalSlot, setRequestModalSlot] = useState(null);
  const [filmTitle, setFilmTitle] = useState("");
  const [filmDescription, setFilmDescription] = useState("");
  const [filmRuntimeMinutes, setFilmRuntimeMinutes] = useState("");
  const [expectedDraw, setExpectedDraw] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get("/api/community-screening/slots");
        if (data.success) setSlots(data.slots);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    load();
  }, [axios]);

  const openRequestModal = (slot) => {
    if (!user) return toast.error("Please sign in to request a slot");
    setRequestModalSlot(slot);
  };

  const submitRequest = async () => {
    if (!filmTitle.trim()) return toast.error("Enter your film's title");
    if (!Number.isFinite(Number(filmRuntimeMinutes)) || Number(filmRuntimeMinutes) <= 0) {
      return toast.error("Enter a valid runtime");
    }
    if (!Number.isFinite(Number(expectedDraw)) || Number(expectedDraw) < 0) {
      return toast.error("Enter your expected draw");
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/community-screening/requests",
        {
          openSlotId: requestModalSlot.slotId,
          filmTitle: filmTitle.trim(),
          filmDescription,
          filmRuntimeMinutes: Number(filmRuntimeMinutes),
          expectedDraw: Number(expectedDraw),
          contactNote,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Request submitted — the theater will review it soon.");
        setRequestModalSlot(null);
        setFilmTitle("");
        setFilmDescription("");
        setFilmRuntimeMinutes("");
        setExpectedDraw("");
        setContactNote("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  if (loading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <BlurCircle top="-100px" left="-100px" />
      <PageHeader eyebrow="Open Screen" title="Open Slots for Community Screenings" />

      <p className="text-sm text-gray-400 -mt-4 mb-8">
        Not verified yet? <Link to="/community/apply" className="text-primary hover:underline">Apply to become a community host</Link>.
        {" "}Already applied? <Link to="/community/my-requests" className="text-primary hover:underline">Check your requests</Link>.
      </p>

      {slots.length === 0 ? (
        <EmptyState
          icon={ClapperboardIcon}
          title="No open slots right now"
          description="Check back later — theaters periodically open off-peak slots for community screenings."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot) => (
            <div key={slot.slotId} className="glass-panel p-5 flex flex-col">
              <p className="font-medium">{slot.theater?.name}</p>
              <p className="text-xs text-gray-400 mb-1">{slot.theater?.city} · {slot.screen?.name}</p>
              <p className="text-sm text-primary mb-2">{new Date(slot.proposedDateTime).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mb-1">Base price: {currency}{slot.basePrice}</p>
              <p className="text-xs text-gray-400 mb-3">Your revenue split: {slot.revenueSplitPercent}%</p>
              {slot.notes && <p className="text-xs text-gray-500 mb-3">{slot.notes}</p>}
              <button
                onClick={() => openRequestModal(slot)}
                className="mt-auto px-4 py-2 text-sm bg-primary rounded-full font-medium cursor-pointer"
              >
                Request This Slot
              </button>
            </div>
          ))}
        </div>
      )}

      {requestModalSlot && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setRequestModalSlot(null)}
        >
          <div className="glass-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Request this slot</p>
              <button onClick={() => setRequestModalSlot(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Film title" value={filmTitle} onChange={(e) => setFilmTitle(e.target.value)} className="glass-input" />
              <textarea rows={3} placeholder="Description (optional)" value={filmDescription} onChange={(e) => setFilmDescription(e.target.value)} className="glass-input resize-none" />
              <input type="number" min="1" placeholder="Runtime (minutes)" value={filmRuntimeMinutes} onChange={(e) => setFilmRuntimeMinutes(e.target.value)} className="glass-input" />
              <input type="number" min="0" placeholder="Expected draw (attendees)" value={expectedDraw} onChange={(e) => setExpectedDraw(e.target.value)} className="glass-input" />
              <input type="text" placeholder="Contact note (optional)" value={contactNote} onChange={(e) => setContactNote(e.target.value)} className="glass-input" />

              <button
                onClick={submitRequest}
                disabled={submitting}
                className="mt-2 px-4 py-2.5 text-sm bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityScreeningBrowse;
