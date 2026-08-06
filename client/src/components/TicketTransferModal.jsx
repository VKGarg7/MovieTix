import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, SendIcon, TagIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";

const TRANSFER_CUTOFF_MINUTES = 30;

const TicketTransferModal = ({ booking, onClose, onDone }) => {
  const { axios, getToken } = useAppContext();
  const [mode, setMode] = useState("direct");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [resalePrice, setResalePrice] = useState(booking.amount);
  const [submitting, setSubmitting] = useState(false);

  const withinCutoff = booking.show?.showDateTime &&
    new Date(booking.show.showDateTime).getTime() - Date.now() < TRANSFER_CUTOFF_MINUTES * 60 * 1000;

  const submit = async () => {
    if (withinCutoff) return toast.error(`Too close to showtime to transfer (within ${TRANSFER_CUTOFF_MINUTES} min)`);

    setSubmitting(true);
    try {
      if (mode === "direct") {
        if (!recipientEmail.trim()) {
          setSubmitting(false);
          return toast.error("Enter the recipient's email");
        }
        const { data } = await axios.post(
          `/api/ticket-transfer/${booking._id}/transfer`,
          { recipientEmail: recipientEmail.trim() },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        if (data.success) {
          toast.success("Ticket transferred — the recipient has been emailed a claim link.");
          onDone();
        } else {
          toast.error(data.message);
        }
      } else {
        if (!Number.isFinite(Number(resalePrice)) || Number(resalePrice) <= 0) {
          setSubmitting(false);
          return toast.error("Enter a valid resale price");
        }
        if (Number(resalePrice) > booking.amount) {
          setSubmitting(false);
          return toast.error(`Resale price can't exceed what you paid (${booking.amount})`);
        }
        const { data } = await axios.post(
          `/api/ticket-transfer/${booking._id}/resell`,
          { resalePrice: Number(resalePrice) },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        if (data.success) {
          toast.success("Ticket listed for resale.");
          onDone();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="glass-panel p-6 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Transfer or resell this ticket</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {withinCutoff && (
            <p className="text-xs text-red-400 mb-4">
              This ticket is within {TRANSFER_CUTOFF_MINUTES} minutes of showtime and can no longer be transferred or resold.
            </p>
          )}

          <div className="flex gap-1 mb-4 bg-white/5 rounded-full p-1">
            <button
              onClick={() => setMode("direct")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors ${mode === "direct" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
            >
              <SendIcon className="w-3.5 h-3.5" /> Direct transfer
            </button>
            <button
              onClick={() => setMode("resale")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors ${mode === "resale" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
            >
              <TagIcon className="w-3.5 h-3.5" /> Resell
            </button>
          </div>

          {mode === "direct" ? (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Recipient's email</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full glass-input"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Free — no payment involved. Your ticket is invalidated immediately; the recipient claims a fresh one.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Resale price (max {booking.amount})</label>
              <input
                type="number"
                min="1"
                max={booking.amount}
                value={resalePrice}
                onChange={(e) => setResalePrice(e.target.value)}
                className="w-full glass-input"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Listed publicly for this show. Capped at what you paid — no markup allowed. You're paid out as account credit once someone claims it.
              </p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || withinCutoff}
            className="w-full mt-5 px-4 py-2.5 text-sm bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Processing..." : mode === "direct" ? "Send Transfer" : "List for Resale"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TicketTransferModal;
