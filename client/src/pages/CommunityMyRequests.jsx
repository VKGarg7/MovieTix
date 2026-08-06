import React, { useState } from "react";
import toast from "react-hot-toast";
import { ClapperboardIcon } from "lucide-react";
import Loading from "../components/Loading";
import PageHeader from "../components/cinematic/PageHeader";
import EmptyState from "../components/admin/EmptyState";
import { useAppContext } from "../context/useAppContext";
import useFetchOnUser from "../hooks/useFetchOnUser";

const STATUS_STYLES = {
  pending: "text-yellow-500",
  approved: "text-primary",
  rejected: "text-red-400",
  withdrawn: "text-gray-500",
};

const CommunityMyRequests = () => {
  const { axios, getToken, user } = useAppContext();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const loadRequests = async () => {
    try {
      const { data } = await axios.get("/api/community-screening/requests/mine", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setRequests(data.requests);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useFetchOnUser(user, loadRequests);

  const withdraw = async (requestId) => {
    setWithdrawingId(requestId);
    try {
      const { data } = await axios.post(
        `/api/community-screening/requests/${requestId}/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Request withdrawn");
        loadRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setWithdrawingId(null);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <PageHeader eyebrow="Open Screen" title="My Screening Requests" />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClapperboardIcon}
          title="No requests yet"
          description="Browse open slots and submit a request to screen your film."
        />
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {requests.map((r) => (
            <div key={r._id} className="glass-panel p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{r.filmTitle}</p>
                <p className="text-xs text-gray-400">
                  {r.openSlotId?.screen?.name} · {r.openSlotId?.proposedDateTime ? new Date(r.openSlotId.proposedDateTime).toLocaleString() : "—"}
                </p>
                {r.status === "rejected" && r.rejectionReason && (
                  <p className="text-xs text-red-400 mt-1">Reason: {r.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium capitalize ${STATUS_STYLES[r.status] || "text-gray-400"}`}>{r.status}</span>
                {r.status === "pending" && (
                  <button
                    onClick={() => withdraw(r._id)}
                    disabled={withdrawingId === r._id}
                    className="text-xs text-gray-400 hover:text-red-400 cursor-pointer disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityMyRequests;
