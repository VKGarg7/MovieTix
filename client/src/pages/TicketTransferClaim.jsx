import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { SignIn } from "@clerk/clerk-react";
import { ArrowRightIcon, SendIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";

const TicketTransferClaim = () => {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const loadTransfer = async () => {
      try {
        const { data } = await axios.get(`/api/ticket-transfer/${transferId}/status`);
        if (data.success) setTransfer(data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    loadTransfer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferId]);

  const claim = async () => {
    if (!user) return toast.error("Please sign in to claim this ticket");
    setClaiming(true);
    try {
      const { data } = await axios.post(
        `/api/ticket-transfer/${transferId}/claim-direct`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Ticket claimed!");
        navigate("/my-bookings");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setClaiming(false);
  };

  if (loading) return <Loading />;

  if (!transfer || transfer.mode !== "direct") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        This transfer link is invalid or no longer available.
      </div>
    );
  }

  const isInactive = transfer.status !== "pending";

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <SendIcon className="w-10 h-10 text-primary mb-4" />
      <h1 className="text-2xl font-semibold mb-1">Someone sent you a ticket</h1>
      <p className="text-gray-400 text-sm mb-1">{transfer.show?.movieTitle}</p>
      {transfer.show?.showDateTime && (
        <p className="text-gray-400 text-sm mb-6">
          {dateFormat(transfer.show.showDateTime)} &middot; {transfer.show?.theater}
        </p>
      )}

      {isInactive ? (
        <p className="text-red-400 text-sm mt-2">This transfer is {transfer.status} and can no longer be claimed.</p>
      ) : !user ? (
        <div className="w-full max-w-sm flex flex-col items-center">
          <p className="text-sm text-gray-300 mb-4 text-center">Sign in to claim your ticket</p>
          <SignIn />
        </div>
      ) : (
        <button
          onClick={claim}
          disabled={claiming}
          className="flex items-center gap-1 mt-4 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50 rounded-full font-medium"
        >
          Claim This Ticket
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TicketTransferClaim;
