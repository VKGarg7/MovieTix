import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRightIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/useAppContext";

const formatCountdown = (ms) => {
  if (ms <= 0) return "Offer expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s left`;
};

const WaitlistClaim = () => {
  const { entryId } = useParams();
  const { axios, getToken, user } = useAppContext();

  const [entryStatus, setEntryStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`/api/waitlist/${entryId}/status`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) setEntryStatus(data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchStatus();
  }, [entryId, user, axios, getToken]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const claimSeat = async () => {
    setClaiming(true);
    try {
      const { data } = await axios.post(
        `/api/waitlist/${entryId}/claim`,
        {},
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
    setClaiming(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Please sign in to claim your seat.
      </div>
    );
  }

  if (loading) return <Loading />;

  if (!entryStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Waitlist offer not found.
      </div>
    );
  }

  const remainingMs = entryStatus.offerExpiresAt ? new Date(entryStatus.offerExpiresAt).getTime() - now : 0;
  const isActive = entryStatus.status === "offered" && remainingMs > 0;

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-2xl font-semibold mb-1">Your Seat Is Ready</h1>
      <p className="text-gray-400 text-sm mb-1">{entryStatus.show?.movieTitle}</p>
      {entryStatus.show?.showDateTime && (
        <p className="text-gray-400 text-sm mb-6">
          {new Date(entryStatus.show.showDateTime).toLocaleString()} &middot; {entryStatus.show?.theater}
        </p>
      )}

      {isActive ? (
        <>
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-8 py-6 text-center mb-6">
            <p className="text-sm text-gray-400 mb-1">Seat offered to you</p>
            <p className="text-3xl font-semibold">{entryStatus.offeredSeat}</p>
            <p className="text-xs text-primary mt-2">{formatCountdown(remainingMs)}</p>
          </div>

          <button
            onClick={claimSeat}
            disabled={claiming}
            className="flex items-center gap-1 px-10 py-3 text-sm bg-primary rounded cursor-pointer active:scale-95 disabled:opacity-50"
          >
            Claim This Seat &amp; Pay
            <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">
            {entryStatus.status === "claimed"
              ? "This offer has already been claimed."
              : "This offer is no longer active or has expired."}
          </p>
          <Link to="/my-bookings#waitlist" className="text-primary text-sm hover:underline">
            Back to My Waitlist
          </Link>
        </div>
      )}
    </div>
  );
};

export default WaitlistClaim;
