import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { NavigationIcon, CheckIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";

const LeaveNowReminderOptIn = ({ bookingId, alreadyOptedIn }) => {
  const { axios, getToken } = useAppContext();
  const [requesting, setRequesting] = useState(false);
  const [optedIn, setOptedIn] = useState(alreadyOptedIn);

  const optIn = () => {
    if (!navigator.geolocation) {
      return toast.error("Location isn't available in this browser");
    }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await axios.post(
            `/api/leave-now-reminder/${bookingId}/opt-in`,
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            { headers: { Authorization: `Bearer ${await getToken()}` } }
          );
          if (data.success) {
            setOptedIn(true);
            toast.success("We'll send a traffic-aware \"leave now\" reminder before showtime.");
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Couldn't set up the reminder");
        }
        setRequesting(false);
      },
      () => {
        toast.error("Location permission denied — you'll still get the standard reminder");
        setRequesting(false);
      },
      { timeout: 8000 }
    );
  };

  if (optedIn) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-primary mb-3">
        <CheckIcon className="w-3.5 h-3.5" />
        Traffic-aware reminder set
      </p>
    );
  }

  return (
    <button
      onClick={optIn}
      disabled={requesting}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary cursor-pointer disabled:opacity-50 mb-3 transition-colors"
    >
      <NavigationIcon className="w-3.5 h-3.5" />
      {requesting ? "Getting your location..." : "Get a traffic-aware \"leave now\" reminder"}
    </button>
  );
};

export default LeaveNowReminderOptIn;
