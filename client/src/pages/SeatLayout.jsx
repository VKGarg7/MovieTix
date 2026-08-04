import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Loading from "../components/Loading";
import isoTimeFormat from "../lib/isoTimeFormat";
import { ArrowRightIcon, ClockIcon, Users, Vote, EyeOffIcon, TrendingDownIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";
import SeatGrid, { SeatTypeLegend } from "../components/SeatGrid";
import PillOptionSelector from "../components/PillOptionSelector";
import ViewFromSeatPreview from "../components/ViewFromSeatPreview";
import { findBestAvailableSeats } from "../lib/bestAvailableSeats";
import { bandForRowIndex, resolveViewFromSeatUrl } from "../lib/viewFromSeat";

const currency = import.meta.env.VITE_CURRENCY;
const MAX_SEATS_PER_BOOKING = 5;

const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [snackQuantities, setSnackQuantities] = useState({});
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsConfig, setPointsConfig] = useState(null);
  const [redeemPointsInput, setRedeemPointsInput] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [bestSeatCount, setBestSeatCount] = useState(() => {
    const seatsParam = searchParams.get("seats");
    const parsed = seatsParam ? parseInt(seatsParam, 10) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_SEATS_PER_BOOKING
      ? parsed
      : 2;
  });
  const [isWatchingPrice, setIsWatchingPrice] = useState(false);
  const [watchPriceLoading, setWatchPriceLoading] = useState(false);
  const [watchedPrice, setWatchedPrice] = useState(null);
  const [previewSeat, setPreviewSeat] = useState(null);
  const [bingePassEligibility, setBingePassEligibility] = useState(null);
  const [useBingePassCredit, setUseBingePassCredit] = useState(false);

  const {axios , getToken , user , selectedTheater , fetchShowDetails} = useAppContext();

  // const navigate = useNavigate();

  const getShow = async () => {
    const data = await fetchShowDetails(id, selectedTheater?._id);
    if (data) {
      setShow(data);
    }
  };

  const getMenu = async () => {
    if (!selectedTheater?._id) return;
    try {
      const { data } = await axios.get('/api/menu', { params: { theaterId: selectedTheater._id } });
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getPoints = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/user/points', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setPointsBalance(data.balance);
        setPointsConfig(data.config);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const changeSnackQuantity = (itemId, delta) => {
    setSnackQuantities((prev) => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      if (next === 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
    setAppliedCoupon(null);
  };

  const selectedSnacks = menuItems
    .filter((item) => snackQuantities[item._id] > 0)
    .map((item) => ({ menuItemId: item._id, name: item.name, price: item.price, quantity: snackQuantities[item._id] }));

  const snacksTotal = selectedSnacks.reduce((sum, s) => sum + s.price * s.quantity, 0);

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select a time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      return toast(`You can only select ${MAX_SEATS_PER_BOOKING} seats`);
    }
    if( occupiedSeats.includes(seatId)){
      return toast("This seat is already occupied");
    } 
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
    setAppliedCoupon(null);
    setPointsToRedeem(0);
    setRedeemPointsInput('');
  };

  const getOccupiedSeats = async () => {
    try {
      const {data} = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if(data.success){
        setOccupiedSeats(data.occupiedSeats)
      }else{
        toast.error(data.message)
      }
      
    } catch (error) {
      console.log(error);
    }
  }

  const handleJoinWaitlist = async () => {
    if (!user) return toast.error("Please login to join the waitlist");
    if (!selectedTime) return;

    setJoiningWaitlist(true);
    try {
      const { data } = await axios.post(
        "/api/waitlist/join",
        { showId: selectedTime.showId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`You're #${data.position} on the waitlist — we'll email you if a seat opens up!`);
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "ALREADY_ON_WAITLIST") {
        toast.error("You're already on the waitlist for this show");
      } else {
        toast.error(error.response?.data?.message || "Failed to join waitlist");
      }
    }
    setJoiningWaitlist(false);
  };

  const handleFindBestSeats = () => {
    if (!selectedTime) return toast("Please select a time first");

    const rows = selectedTime.screen?.rows || [];
    const { seats, isFullMatch } = findBestAvailableSeats(rows, bestSeatCount, occupiedSeats);

    if (seats.length === 0) {
      return toast.error("No available seats found for this showtime");
    }

    setSelectedSeats(seats);
    setAppliedCoupon(null);
    setPointsToRedeem(0);
    setRedeemPointsInput('');

    if (isFullMatch) {
      toast.success(`Best available seats selected: ${seats.join(", ")}`);
    } else {
      toast(`No contiguous block of ${bestSeatCount} seats is available — selected the largest available block instead: ${seats.join(", ")}`);
    }
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return toast.error("Enter a coupon code");
    if (!selectedTime || !selectedSeats.length)
        return toast.error("Please select a time and seats first");

    setCouponLoading(true);
    try {
      const amount = selectedTime.computedPrice * selectedSeats.length;
      const {data} = await axios.post('/api/coupon/validate',
        { code: couponInput.trim(), theaterId: selectedTheater?._id, amount },
        {headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success){
        setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalAmount: data.finalAmount });
        toast.success("Coupon applied");
      }
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || error.message);
    }
    setCouponLoading(false);
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  }

  const ticketAmount = selectedTime ? selectedTime.computedPrice * selectedSeats.length : 0;
  const ticketAmountAfterCoupon = appliedCoupon ? appliedCoupon.finalAmount : ticketAmount;
  const pointsDiscount = pointsConfig
    ? Math.min(pointsToRedeem * pointsConfig.redemptionValue, ticketAmountAfterCoupon * pointsConfig.maxRedemptionFractionOfAmount)
    : 0;
  const bingePassDiscount = useBingePassCredit
    ? Math.min(ticketAmountAfterCoupon, selectedTime ? selectedTime.computedPrice * selectedSeats.length : 0)
    : 0;

  const applyPoints = () => {
    const requested = parseInt(redeemPointsInput, 10);
    if (!Number.isInteger(requested) || requested <= 0) {
      return toast.error("Enter a valid number of points");
    }
    if (requested > pointsBalance) {
      return toast.error("You don't have that many points");
    }
    setPointsToRedeem(requested);
    toast.success("Points applied");
  }

  const removePoints = () => {
    setPointsToRedeem(0);
    setRedeemPointsInput('');
  }

  const bookTickets = async () => {
    try {
      if(!user) return toast.error("Please login to book tickets");

      if(!selectedTime || !selectedSeats.length)
          return toast.error("Please select a time and seats to book");

      const {data} = await axios.post('/api/booking/create' ,
        { showId: selectedTime.showId, selectedSeats, couponCode: appliedCoupon?.code || undefined, snacks: selectedSnacks, redeemPoints: pointsToRedeem || undefined, useBingePassCredit },
        {headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success){
        if (data.isPaid) {
          toast.success("Booking confirmed with Binge Pass credit!");
          navigate("/my-bookings");
        } else if (data.url) {
          window.location.href = data.url;
        }
      }else{
        toast.error(data.message);
      }

    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
    }
  }

  useEffect(() => {
    getShow();
    getMenu();
    getPoints();
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if(selectedTime){
      getOccupiedSeats();
    }
    // only re-run when the selected time changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime])

  useEffect(() => {
    if (!show || selectedTime) return;
    const timeParam = searchParams.get("time");
    if (!timeParam) return;

    const showtimes = show.dateTime?.[date] || [];
    const match = showtimes.find((s) => s.showId === timeParam);
    if (match) {
      setSelectedTime(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, date, searchParams]);

  const getWatchStatus = async (showId) => {
    if (!user) { setIsWatchingPrice(false); setWatchedPrice(null); return; }
    try {
      const { data } = await axios.get(`/api/price-watch/${showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setIsWatchingPrice(data.watching);
        setWatchedPrice(data.priceAtWatchTime);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedTime) getWatchStatus(selectedTime.showId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime, user]);

  useEffect(() => {
    if (!selectedTime || !user) {
      setBingePassEligibility(null);
      setUseBingePassCredit(false);
      return;
    }
    let cancelled = false;
    const checkEligibility = async () => {
      try {
        const { data } = await axios.get(`/api/subscription/binge-pass/eligibility/${selectedTime.showId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && data.success) {
          setBingePassEligibility(data);
          if (!data.eligible) setUseBingePassCredit(false);
        }
      } catch (error) {
        console.log(error);
      }
    };
    checkEligibility();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime, user]);

  const handleToggleWatchPrice = async () => {
    if (!user) return toast.error("Please login to watch this show's price");
    if (!selectedTime) return toast("Please select a time first");

    setWatchPriceLoading(true);
    try {
      if (isWatchingPrice) {
        const { data } = await axios.delete(`/api/price-watch/${selectedTime.showId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          setIsWatchingPrice(false);
          setWatchedPrice(null);
          toast.success("Stopped watching this show's price");
        }
      } else {
        const { data } = await axios.post(
          "/api/price-watch",
          { showId: selectedTime.showId },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        if (data.success) {
          setIsWatchingPrice(true);
          setWatchedPrice(data.priceAtWatchTime);
          toast.success("We'll email you if the price drops");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update price watch");
    }
    setWatchPriceLoading(false);
  };

  return show ? (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      {/*available timings*/}
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {show.dateTime[date].map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition 
                ${
                  selectedTime?.time === item.time
                    ? "bg-primary text-white"
                    : "hover:bg-primary/20"
                }`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(item.time)}</p>
              {item.isSoldOut && (
                <span className="text-[9px] font-semibold text-red-400 border border-red-400/50 rounded px-1">
                  SOLD OUT
                </span>
              )}
            </div>
          ))}
        </div>

        {selectedTime && (
          <div className="px-6 mt-5">
            <button
              onClick={handleToggleWatchPrice}
              disabled={watchPriceLoading}
              title={isWatchingPrice ? "Stop watching this show's price" : "Get an email if this show's price drops"}
              className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/40 rounded-full px-3 py-1.5 hover:bg-primary/10 cursor-pointer transition disabled:opacity-50"
            >
              <TrendingDownIcon className={`w-3.5 h-3.5 ${isWatchingPrice ? "text-primary" : ""}`} />
              {isWatchingPrice ? `Watching (${currency}${watchedPrice})` : "Watch Price"}
            </button>
          </div>
        )}
      </div>

      {/*seat layout*/}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0px" right="0px" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>

        {show.movie?.isMysteryMovie && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 text-xs bg-primary/10 border border-primary/30 rounded-full text-primary">
            <EyeOffIcon className="w-3.5 h-3.5" />
            Mystery Movie &middot; {show.movie.genres?.map((g) => g.name).join(", ")} &middot; {show.movie.ratingBand}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            onClick={() => navigate(`/movies/${id}/${date}/group-booking`)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-primary border border-primary/40 rounded-full hover:bg-primary/10 cursor-pointer transition"
          >
            <Users className="w-3.5 h-3.5" />
            Start a Watch Party instead
          </button>
          <button
            onClick={() => navigate(`/movies/${id}/showtime-poll`)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-primary border border-primary/40 rounded-full hover:bg-primary/10 cursor-pointer transition"
          >
            <Vote className="w-3.5 h-3.5" />
            Poll friends on a time first
          </button>
        </div>

        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        {selectedTime?.isSoldOut ? (
          <div className="mt-6 w-full max-w-sm flex flex-col items-center gap-3 bg-red-950/30 border border-red-500/30 rounded-lg px-6 py-5 text-center">
            <p className="text-sm font-medium text-red-400">This show is sold out</p>
            <button
              onClick={handleJoinWaitlist}
              disabled={joiningWaitlist}
              className="px-6 py-2 text-sm bg-primary rounded-full cursor-pointer disabled:opacity-50"
            >
              {joiningWaitlist ? "Joining..." : "Join Waitlist"}
            </button>
          </div>
        ) : (
          <>
            {selectedTime?.screen?.rows?.length > 0 && <SeatTypeLegend />}

            {selectedTime?.screen?.rows?.length > 0 && (
              <div className="flex flex-col items-center gap-2 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">Seats:</span>
                  <PillOptionSelector
                    options={Array.from({ length: MAX_SEATS_PER_BOOKING }, (_, i) => i + 1)}
                    value={bestSeatCount}
                    onChange={setBestSeatCount}
                    circular
                  />
                </div>
                <button
                  onClick={handleFindBestSeats}
                  className="px-4 py-1.5 text-xs font-medium bg-primary rounded-full cursor-pointer active:scale-95"
                >
                  Best Available Seats
                </button>
              </div>
            )}

            <SeatGrid
              rows={selectedTime?.screen?.rows}
              onSeatClick={handleSeatClick}
              seatState={(seatId) => ({
                selected: selectedSeats.includes(seatId),
                disabled: occupiedSeats.includes(seatId),
              })}
              onSeatPreview={(seatId) => {
                const rows = selectedTime?.screen?.rows || [];
                const rowIndex = rows.findIndex((r) => seatId.startsWith(r.label));
                if (rowIndex === -1) return;
                const band = bandForRowIndex(rowIndex, rows.length);
                setPreviewSeat({
                  seatId,
                  imageUrl: resolveViewFromSeatUrl(selectedTime?.screen?.viewFromSeat, band),
                });
              }}
            />

            <ViewFromSeatPreview
              seatId={previewSeat?.seatId}
              imageUrl={previewSeat?.imageUrl}
              onClose={() => setPreviewSeat(null)}
            />
          </>
        )}

        {selectedSeats.length > 0 && menuItems.length > 0 && (
          <div className="mt-16 w-full max-w-xs">
            <p className="text-sm font-semibold mb-2">Add snacks</p>
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between text-sm bg-primary/10 border border-primary/20 rounded px-3 py-2">
                  <span>{item.name} <span className="text-gray-400">({currency}{item.price})</span></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeSnackQuantity(item._id, -1)}
                      disabled={!snackQuantities[item._id]}
                      className="w-6 h-6 rounded border border-primary/40 cursor-pointer disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-4 text-center">{snackQuantities[item._id] || 0}</span>
                    <button
                      onClick={() => changeSnackQuantity(item._id, 1)}
                      className="w-6 h-6 rounded border border-primary/40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSeats.length > 0 && selectedTime && (
          <div className="mt-8 w-full max-w-xs text-sm">
            <div className="flex items-center justify-between text-gray-300">
              <span>
                {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} &times; {currency}{selectedTime.computedPrice}
                {selectedTime.computedPrice !== selectedTime.showPrice && (
                  <span className="text-primary text-xs ml-1">(dynamic price)</span>
                )}
              </span>
              <span>{currency}{ticketAmount}</span>
            </div>
            {snacksTotal > 0 && (
              <div className="flex items-center justify-between text-gray-300 mt-1">
                <span>Snacks</span>
                <span>{currency}{snacksTotal}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex items-center justify-between text-primary mt-1">
                <span>Points redeemed ({pointsToRedeem})</span>
                <span>-{currency}{pointsDiscount}</span>
              </div>
            )}
            {bingePassDiscount > 0 && (
              <div className="flex items-center justify-between text-primary mt-1">
                <span>Binge Pass credit</span>
                <span>-{currency}{bingePassDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold mt-1 pt-1 border-t border-primary/20">
              <span>Total</span>
              <span>
                {currency}
                {Math.max(0, ticketAmountAfterCoupon - pointsDiscount - bingePassDiscount) + snacksTotal}
              </span>
            </div>
          </div>
        )}

        {selectedSeats.length > 0 && bingePassEligibility?.eligible && (
          <div className="mt-4 w-full max-w-xs">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useBingePassCredit}
                onChange={(e) => setUseBingePassCredit(e.target.checked)}
                className="cursor-pointer"
              />
              <span>
                Use a Binge Pass credit
                <span className="text-gray-400 text-xs ml-1">
                  ({bingePassEligibility.creditsRemaining} remaining)
                </span>
              </span>
            </label>
          </div>
        )}

        {selectedSeats.length > 0 && (
          <div className="mt-4 w-full max-w-xs">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded px-4 py-2 text-sm">
                <span>
                  <span className="font-medium text-primary">{appliedCoupon.code}</span> applied — saved{" "}
                  {appliedCoupon.discountAmount}
                </span>
                <button onClick={removeCoupon} className="text-gray-400 text-xs cursor-pointer">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="px-4 py-2 text-sm bg-primary rounded cursor-pointer disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {selectedSeats.length > 0 && pointsBalance > 0 && (
          <div className="mt-3 w-full max-w-xs">
            {pointsToRedeem > 0 ? (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded px-4 py-2 text-sm">
                <span>
                  <span className="font-medium text-primary">{pointsToRedeem} points</span> applied
                </span>
                <button onClick={removePoints} className="text-gray-400 text-xs cursor-pointer">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={pointsBalance}
                  placeholder={`Redeem points (${pointsBalance} available)`}
                  value={redeemPointsInput}
                  onChange={(e) => setRedeemPointsInput(e.target.value)}
                  className="flex-1 bg-primary/10 border border-primary/30 rounded px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={applyPoints}
                  className="px-4 py-2 text-sm bg-primary rounded cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedTime?.isSoldOut && (
          <button
            onClick={bookTickets}
            className="flex items-center gap-1 mt-6 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95"
          >
            Proceed to Checkout
            <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
