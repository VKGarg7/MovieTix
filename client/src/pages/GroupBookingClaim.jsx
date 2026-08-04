import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRightIcon } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import SeatGrid, { SeatTypeLegend } from "../components/SeatGrid";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 6000;
const MAX_CLAIM_SEATS = 5;

const GroupBookingClaim = () => {
  const { groupId } = useParams();
  const { axios, getToken, user } = useAppContext();

  const [groupStatus, setGroupStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/group-booking/${groupId}/status`);
      if (!isCancelled() && data.success) {
        setGroupStatus(data);
        setSelectedSeats((prev) => prev.filter((seat) => {
          const seatInfo = data.seats.find((s) => s.seat === seat);
          return seatInfo && !seatInfo.claimed;
        }));
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { deps: [groupId, axios] });

  const handleSeatClick = (seatId) => {
    const seatInfo = groupStatus.seats.find((s) => s.seat === seatId);
    if (!seatInfo || seatInfo.claimed) return;

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_CLAIM_SEATS) {
      return toast(`You can only claim up to ${MAX_CLAIM_SEATS} seats`);
    }
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((seat) => seat !== seatId) : [...prev, seatId]
    );
  };

  const claimSeats = async () => {
    if (!user) return toast.error("Please sign in to claim seats");
    if (!selectedSeats.length) return toast.error("Select at least one seat to claim");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/group-booking/${groupId}/claim`,
        { selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  if (loading) return <Loading />;

  if (!groupStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Group booking not found.
      </div>
    );
  }

  const isInactive = groupStatus.status !== "active";

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Join the Watch Party</h1>
      <p className="text-gray-400 text-sm mb-1">{groupStatus.show?.movieTitle}</p>
      {groupStatus.show?.showDateTime && (
        <p className="text-gray-400 text-sm mb-6">
          {new Date(groupStatus.show.showDateTime).toLocaleString()} &middot; {groupStatus.show?.theater}
        </p>
      )}

      <p className="text-sm text-gray-300 mb-2">
        {groupStatus.claimedCount}/{groupStatus.totalSeats} seats claimed
        {" "}&middot;{" "}
        {groupStatus.paidCount}/{groupStatus.totalSeats} paid
      </p>

      {isInactive ? (
        <p className="text-red-400 text-sm mt-4">
          This group booking is {groupStatus.status} and no longer accepting claims.
        </p>
      ) : (
        <>
          <SeatTypeLegend />
          <SeatGrid
            rows={groupStatus.show?.rows}
            onSeatClick={handleSeatClick}
            seatState={(seatId) => {
              const seatInfo = groupStatus.seats.find((s) => s.seat === seatId);
              if (!seatInfo) return { selected: false, disabled: true };
              return {
                selected: selectedSeats.includes(seatId),
                disabled: seatInfo.claimed,
                extraClass: seatInfo.claimed ? (seatInfo.isPaid ? "bg-green-900/40" : "bg-yellow-900/40") : "",
              };
            }}
          />

          {!user && selectedSeats.length > 0 && (
            <div className="mt-8 w-full max-w-sm flex flex-col items-center">
              <p className="text-sm text-gray-300 mb-4 text-center">Sign in to claim your selected seats</p>
              <SignIn />
            </div>
          )}

          {(user || selectedSeats.length === 0) && (
            <button
              onClick={claimSeats}
              disabled={submitting || !selectedSeats.length}
              className="flex items-center gap-1 mt-8 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Claim {selectedSeats.length || ""} Seat{selectedSeats.length === 1 ? "" : "s"} &amp; Pay
              <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GroupBookingClaim;
