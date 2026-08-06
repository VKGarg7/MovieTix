import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { TagIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import PageHeader from "../components/cinematic/PageHeader";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/useAppContext";

const TicketResaleBrowse = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get("/api/ticket-transfer/resale");
        if (data.success) setListings(data.listings);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    load();
  }, [axios]);

  const claim = async (transferId) => {
    if (!user) return toast.error("Please sign in to buy this ticket");
    setClaimingId(transferId);
    try {
      const { data } = await axios.post(
        `/api/ticket-transfer/${transferId}/claim-resale`,
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
    setClaimingId(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <BlurCircle top="-100px" left="-100px" />
      <PageHeader eyebrow="Resale" title="Tickets for Resale" />

      {listings.length === 0 ? (
        <p className="text-gray-400 text-sm">No tickets listed for resale right now.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <div key={listing.transferId} className="glass-panel p-4 flex flex-col">
              {listing.show.poster_path && (
                <img
                  src={image_base_url + listing.show.poster_path}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-video object-cover rounded-xl mb-3"
                />
              )}
              <p className="font-medium">{listing.show.movieTitle}</p>
              <p className="text-xs text-gray-400 mb-1">{dateFormat(listing.show.showDateTime)}</p>
              <p className="text-xs text-gray-400 mb-3">{listing.show.theater}</p>
              <p className="text-xs text-gray-400 mb-3">Seats: {listing.seats.join(", ")}</p>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <TagIcon className="w-3.5 h-3.5" />
                  {currency}{listing.resalePrice}
                  {listing.resalePrice < listing.originalPrice && (
                    <span className="text-xs text-gray-500 line-through ml-1">{currency}{listing.originalPrice}</span>
                  )}
                </div>
                <button
                  onClick={() => claim(listing.transferId)}
                  disabled={claimingId === listing.transferId}
                  className="px-4 py-1.5 text-xs bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
                >
                  {claimingId === listing.transferId ? "Starting..." : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketResaleBrowse;
