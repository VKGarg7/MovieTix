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

const GiftTicketCreate = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
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
    if (occupiedSeats.includes(seatId)) return toast("This seat is already occupied");
    setSelectedSeat((prev) => (prev === seatId ? null : seatId));
  };

  const giftTicket = async () => {
    if (!user) return toast.error("Please login to gift a ticket");
    if (!selectedTime || !selectedSeat) return toast.error("Please select a time and seat to gift");
    if (!recipientEmail.trim()) return toast.error("Enter the recipient's email");

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/group-booking/gift",
        {
          showId: selectedTime.showId,
          seat: selectedSeat,
          recipientEmail: recipientEmail.trim(),
          message,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success("Ticket gifted! We've emailed the recipient their claim link.");
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
        <h1 className="text-2xl font-semibold mb-1">Gift a Ticket</h1>
        <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
          Pick a seat, we'll hold it and email your friend a claim link — they pick their exact seat and confirm it themselves.
        </p>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        {selectedTime?.screen?.rows?.length > 0 && <SeatTypeLegend />}

        <SeatGrid
          rows={selectedTime?.screen?.rows}
          onSeatClick={handleSeatClick}
          seatState={(seatId) => ({
            selected: selectedSeat === seatId,
            disabled: occupiedSeats.includes(seatId),
          })}
        />

        {selectedSeat && (
          <div className="mt-8 w-full max-w-xs text-sm space-y-3">
            <p className="text-gray-300">Seat {selectedSeat} reserved for your gift</p>
            <div>
              <label className="block text-gray-400 mb-1">Recipient's email</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Message (optional)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Happy birthday! Enjoy the show."
                className="w-full bg-primary/10 border border-primary/30 rounded px-3 py-2 outline-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={giftTicket}
          disabled={submitting}
          className="flex items-center gap-1 mt-6 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95 disabled:opacity-50"
        >
          Gift This Seat
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default GiftTicketCreate;
