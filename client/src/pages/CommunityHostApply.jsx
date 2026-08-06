import React, { useState } from "react";
import toast from "react-hot-toast";
import { ClapperboardIcon } from "lucide-react";
import { Link } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import PageHeader from "../components/cinematic/PageHeader";
import Loading from "../components/Loading";
import { useAppContext } from "../context/useAppContext";
import useFetchOnUser from "../hooks/useFetchOnUser";

const CommunityHostApply = () => {
  const { axios, getToken, user } = useAppContext();

  const [host, setHost] = useState(undefined);
  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await axios.get("/api/community-host/mine", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setHost(data.host);
    } catch (error) {
      console.log(error);
    }
  };

  useFetchOnUser(user, loadProfile);

  const apply = async (e) => {
    e.preventDefault();
    if (!organizationName.trim()) return toast.error("Enter your organization/group name");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/community-host/apply",
        { organizationName: organizationName.trim(), description },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Application submitted — an admin will review it soon.");
        setHost(data.host);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  if (host === undefined) return <Loading />;

  return (
    <div className="relative flex flex-col items-center px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <PageHeader eyebrow="Open Screen" title="Become a Community Host" className="mb-8 text-center" />

      {host ? (
        <div className="glass-panel w-full max-w-md p-6 text-center">
          <ClapperboardIcon className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="font-medium mb-1">{host.organizationName}</p>
          <p className={`text-sm mb-4 ${host.verified ? "text-primary" : "text-yellow-500"}`}>
            {host.verified ? (host.eligible ? "Verified & eligible" : "Verified, but eligibility revoked") : "Pending verification"}
          </p>
          {host.verified && host.eligible && (
            <Link to="/community/screenings" className="px-5 py-2.5 text-sm bg-primary rounded-full font-medium cursor-pointer inline-block">
              Browse Open Slots
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={apply} className="glass-panel w-full max-w-md p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization / film club name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Riverside Film Collective"
              className="w-full glass-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tell us about your work (optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of films/events do you screen?"
              className="w-full glass-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-sm bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CommunityHostApply;
