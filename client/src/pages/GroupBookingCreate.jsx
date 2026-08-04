import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import isoTimeFormat from "../lib/isoTimeFormat";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";
import SeatGrid, { SeatTypeLegend } from "../components/SeatGrid";
import PillOptionSelector from "../components/PillOptionSelector";

const MAX_GROUP_BLOCK_SIZE = 30;

const GroupBookingCreate = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [organizerNote, setOrganizerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { axios, getToken, user, selectedTheater, fetchShowDetails } = useAppContext();

  const getShow = async () => {
    const data = await fetchShowDetails(id, selectedTheater?._id);
    if (data) setShow(data);
  };

  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast("Please select a time first");
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_GROUP_BLOCK_SIZE) {
      return toast(`You can only reserve up to ${MAX_GROUP_BLOCK_SIZE} seats`);
    }
    if (occupiedSeats.includes(seatId)) return toast("This seat is already occupied");

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((seat) => seat !== seatId) : [...prev, seatId]
    );
  };

  const createGroupBooking = async () => {
    if (!user) return toast.error("Please login to start a watch party");
    if (!selectedTime || !selectedSeats.length)
      return toast.error("Please select a time and seats to reserve");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/group-booking/create",
        {
          showId: selectedTime.showId,
          seatBlock: selectedSeats,
          expiresInHours,
          organizerNote,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        navigate(`/group-booking/${data.groupId}/manage`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  useEffect(() => {
    getShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTime) getOccupiedSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime]);

  return show ? (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {show.dateTime[date].map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition
                ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(item.time)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0px" right="0px" />
        <h1 className="text-2xl font-semibold mb-1">Start a Watch Party</h1>
        <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
          Reserve a block of seats and share the link — each friend claims and pays for their own seats.
        </p>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        {selectedTime?.screen?.rows?.length > 0 && <SeatTypeLegend />}

        <SeatGrid
          rows={selectedTime?.screen?.rows}
          onSeatClick={handleSeatClick}
          seatState={(seatId) => ({
            selected: selectedSeats.includes(seatId),
            disabled: occupiedSeats.includes(seatId),
          })}
        />

        {selectedSeats.length > 0 && (
          <div className="mt-8 w-full max-w-xs text-sm space-y-3">
            <p className="text-gray-300">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} reserved for your group
            </p>
            <div>
              <label className="block text-gray-400 mb-1">Claim window</label>
              <PillOptionSelector
                options={[6, 12, 24, 48, 72]}
                value={expiresInHours}
                onChange={setExpiresInHours}
                renderLabel={(hours) => `${hours}h`}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Note for your friends (optional)</label>
              <input
                type="text"
                value={organizerNote}
                onChange={(e) => setOrganizerNote(e.target.value)}
                placeholder="e.g. Grab any seat, snacks on me!"
                className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 outline-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={createGroupBooking}
          disabled={submitting}
          className="flex items-center gap-1 mt-6 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50"
        >
          Reserve &amp; Get Share Link
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default GroupBookingCreate;
