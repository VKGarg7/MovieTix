import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Copy, XCircle } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 6000;

const GroupBookingManage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [groupStatus, setGroupStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const shareUrl = `${window.location.origin}/group-booking/${groupId}`;

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/group-booking/${groupId}/manage`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!isCancelled() && data.success) setGroupStatus(data);
    } catch (error) {
      if (!isCancelled()) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          toast.error(error.response?.data?.message || "Not authorized to view this group booking");
          navigate("/");
        } else {
          console.log(error);
        }
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { enabled: Boolean(user), deps: [groupId, user] });

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const cancelGroupBooking = async () => {
    setCancelling(true);
    try {
      const { data } = await axios.post(
        `/api/group-booking/${groupId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message);
        setShowCancelConfirm(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setCancelling(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Please sign in to manage your group booking.
      </div>
    );
  }

  if (loading) return <Loading />;
  if (!groupStatus) return null;

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Watch Party Dashboard</h1>
      <p className="text-gray-400 text-sm mb-1">{groupStatus.show?.movieTitle}</p>
      {groupStatus.show?.showDateTime && (
        <p className="text-gray-400 text-sm mb-6">
          {new Date(groupStatus.show.showDateTime).toLocaleString()} &middot; {groupStatus.show?.theater}
        </p>
      )}

      <div className="w-full max-w-md bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300 mb-2">Share this link with your friends:</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-black/20 border border-primary/30 rounded px-3 py-2 text-xs outline-none"
          />
          <button onClick={copyLink} className="p-2 bg-primary rounded cursor-pointer">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-md text-sm text-gray-300 mb-4 flex items-center justify-between">
        <span>Status: <span className="text-primary">{groupStatus.status}</span></span>
        <span>Expires: {new Date(groupStatus.expiresAt).toLocaleString()}</span>
      </div>

      <div className="w-full max-w-md flex items-center justify-between text-sm mb-6">
        <span>{groupStatus.claimedCount}/{groupStatus.totalSeats} claimed</span>
        <span>{groupStatus.paidCount}/{groupStatus.totalSeats} paid</span>
      </div>

      <div className="w-full max-w-md space-y-2 mb-8">
        {groupStatus.seats.map((seat) => (
          <div
            key={seat.seat}
            className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded px-4 py-2 text-sm"
          >
            <span className="font-medium">{seat.seat}</span>
            <span className="text-gray-400">
              {seat.isPaid ? "Paid" : seat.userId ? "Claimed, awaiting payment" : "Unclaimed"}
            </span>
          </div>
        ))}
      </div>

      {groupStatus.status === "active" && (
        showCancelConfirm ? (
          <div className="w-full max-w-md bg-red-950/30 border border-red-500/40 rounded-lg p-4 text-sm">
            <p className="mb-3">
              Cancelling will refund any paid claimants and release all seats. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={cancelGroupBooking}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 rounded cursor-pointer disabled:opacity-50"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 bg-primary/20 rounded cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:underline cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            Cancel Watch Party
          </button>
        )
      )}
    </div>
  );
};

export default GroupBookingManage;
