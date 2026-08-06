import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PlusIcon, CheckIcon, XIcon, TrashIcon, UsersIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/admin/EmptyState";
import PaginationShell from "../../components/admin/PaginationShell";

const OpenScreen = () => {
  const { axios, getToken, user, fetchTheaters, fetchScreens } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [proposedDateTime, setProposedDateTime] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [revenueSplitPercent, setRevenueSplitPercent] = useState(70);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const [slots, setSlots] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingId, setActingId] = useState(null);

  const authHeaders = async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

  const loadSlots = async () => {
    try {
      const { data } = await axios.get("/api/community-screening/slots/admin", {
        params: { page },
        ...(await authHeaders()),
      });
      if (data.success) {
        setSlots(data.slots);
        setTotalPages(data.pageInfo?.totalPages || 1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load open slots");
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await axios.get("/api/community-screening/requests/admin", {
        params: { status: "pending" },
        ...(await authHeaders()),
      });
      if (data.success) setRequests(data.requests);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load screening requests");
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSlots(), loadRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadAll();
      fetchTheaters().then(setTheaters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  useEffect(() => {
    setSelectedScreen("");
    if (selectedTheater) {
      fetchScreens(selectedTheater).then(setScreens);
    } else {
      setScreens([]);
    }
  }, [selectedTheater, fetchScreens]);

  const handleMarkSlot = async (e) => {
    e.preventDefault();
    if (!selectedScreen || !proposedDateTime || !basePrice) {
      return toast.error("Screen, date/time and base price are required");
    }

    setCreating(true);
    try {
      const { data } = await axios.post(
        "/api/community-screening/slots",
        {
          screenId: selectedScreen,
          proposedDateTime: new Date(proposedDateTime).toISOString(),
          basePrice: Number(basePrice),
          revenueSplitPercent: Number(revenueSplitPercent),
          notes,
          theaterId: selectedTheater || undefined,
        },
        await authHeaders()
      );
      if (data.success) {
        toast.success("Slot marked as open for community requests");
        setProposedDateTime("");
        setBasePrice("");
        setNotes("");
        loadSlots();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to mark slot");
    }
    setCreating(false);
  };

  const cancelSlot = async (slotId) => {
    setActingId(slotId);
    try {
      const { data } = await axios.delete(`/api/community-screening/slots/${slotId}`, await authHeaders());
      if (data.success) {
        toast.success("Slot cancelled");
        loadSlots();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel slot");
    }
    setActingId(null);
  };

  const approveRequest = async (requestId) => {
    setActingId(requestId);
    try {
      const { data } = await axios.post(`/api/community-screening/requests/${requestId}/approve`, {}, await authHeaders());
      if (data.success) {
        toast.success("Request approved — show is now live");
        loadAll();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve request");
    }
    setActingId(null);
  };

  const rejectRequest = async (requestId) => {
    const reason = window.prompt("Reason for rejection (optional):") || "";
    setActingId(requestId);
    try {
      const { data } = await axios.post(`/api/community-screening/requests/${requestId}/reject`, { reason }, await authHeaders());
      if (data.success) {
        toast.success("Request rejected");
        loadAll();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject request");
    }
    setActingId(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <p className="section-eyebrow mb-1">Open Screen</p>
        <p className="text-lg font-display font-medium">Indie &amp; Community Screening Marketplace</p>
        <p className="text-sm text-gray-400 mt-1">Mark off-peak slots open for community requests, then review and approve incoming submissions.</p>
      </div>

      <motion.form
        onSubmit={handleMarkSlot}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1">Theater</label>
          <select value={selectedTheater} onChange={(e) => setSelectedTheater(e.target.value)} className="glass-input w-full">
            <option value="" className="bg-[#1a1a1c]">Select theater</option>
            {theaters.map((t) => (
              <option key={t._id} value={t._id} className="bg-[#1a1a1c]">{t.name} · {t.city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Screen</label>
          <select value={selectedScreen} onChange={(e) => setSelectedScreen(e.target.value)} disabled={!selectedTheater} className="glass-input w-full disabled:opacity-50">
            <option value="" className="bg-[#1a1a1c]">Select screen</option>
            {screens.map((s) => (
              <option key={s._id} value={s._id} className="bg-[#1a1a1c]">{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Proposed date &amp; time</label>
          <input type="datetime-local" value={proposedDateTime} onChange={(e) => setProposedDateTime(e.target.value)} className="glass-input w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Base price ({currency})</label>
          <input type="number" min="1" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="glass-input w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Host revenue split (%)</label>
          <input type="number" min="0" max="100" value={revenueSplitPercent} onChange={(e) => setRevenueSplitPercent(e.target.value)} className="glass-input w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Tuesday off-peak matinee" className="glass-input w-full" />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            {creating ? "Marking..." : "Mark Slot as Open"}
          </button>
        </div>
      </motion.form>

      <div>
        <p className="font-medium mb-3 text-sm flex items-center gap-2"><UsersIcon className="w-4 h-4 text-primary" /> Pending Requests</p>
        {requests.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No pending requests"
            description="Community screening requests against your open slots will appear here for review."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{r.filmTitle}</p>
                  <p className="text-xs text-gray-400">{r.filmRuntimeMinutes} min · Expected draw: {r.expectedDraw}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Slot: {r.openSlotId?.screen?.name} · {r.openSlotId?.proposedDateTime ? new Date(r.openSlotId.proposedDateTime).toLocaleString() : "—"}
                  </p>
                  {r.filmDescription && <p className="text-xs text-gray-500 mt-1 max-w-md">{r.filmDescription}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approveRequest(r._id)}
                    disabled={actingId === r._id}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
                  >
                    <CheckIcon className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(r._id)}
                    disabled={actingId === r._id}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs border border-red-500 text-red-500 rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-red-500/10"
                  >
                    <XIcon className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="font-medium mb-3 text-sm">Open Slots</p>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-400">No open slots marked yet.</p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot._id} className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{slot.screen?.name} · {new Date(slot.proposedDateTime).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {currency}{slot.basePrice} · Host split {slot.revenueSplitPercent}% ·{" "}
                    <span className={slot.status === "open" ? "text-primary" : slot.status === "filled" ? "text-green-400" : "text-gray-500"}>
                      {slot.status}
                    </span>
                  </p>
                </div>
                {slot.status === "open" && (
                  <button
                    onClick={() => cancelSlot(slot._id)}
                    disabled={actingId === slot._id}
                    className="text-gray-400 hover:text-red-400 cursor-pointer disabled:opacity-50"
                    title="Cancel slot"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <PaginationShell page={page} totalPages={totalPages} onPageChange={setPage} simple />
      </div>
    </div>
  );
};

export default OpenScreen;
