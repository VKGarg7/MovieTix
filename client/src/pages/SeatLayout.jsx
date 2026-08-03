import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import isoTimeFormat from "../lib/isoTimeFormat";
import { ArrowRightIcon, ClockIcon, Star, Sofa, Accessibility } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";

const SEAT_TYPE_META = {
  regular: { label: "Regular", border: "border-primary/60", icon: null },
  premium: { label: "Premium", border: "border-amber-400/80", icon: Star },
  recliner: { label: "Recliner", border: "border-purple-400/80", icon: Sofa },
  accessible: { label: "Accessible", border: "border-sky-400/80", icon: Accessibility },
};

const getSeatTypeMeta = (seatType) => SEAT_TYPE_META[seatType] || SEAT_TYPE_META.regular;
const currency = import.meta.env.VITE_CURRENCY;

const SeatLayout = () => {
  const { id, date } = useParams();
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
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select 5 seats");
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

  const renderSeats = (rowLabel, seatCount, seatType = "regular") => {
    const { label, border, icon: SeatIcon } = getSeatTypeMeta(seatType);

    return (
      <div key={rowLabel} className="flex items-center gap-3 mt-2">
        <span className="w-4 shrink-0 text-gray-500">{rowLabel}</span>
        <div className="flex flex-nowrap items-center gap-2">
          {Array.from({ length: seatCount }, (_, i) => {
            const seatId = `${rowLabel}${i + 1}`;
            const isSelected = selectedSeats.includes(seatId);
            const isOccupied = occupiedSeats.includes(seatId);
            return (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                title={`${seatId} — ${label}`}
                className={`relative h-8 w-8 shrink-0 rounded border cursor-pointer flex items-center justify-center text-[10px]
              ${border}
              ${isSelected ? "bg-primary text-white" : ""}
              ${isOccupied ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {seatId}
                {SeatIcon && (
                  <SeatIcon className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#1f1f24] rounded-full p-0.5 box-content" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
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
        { showId: selectedTime.showId, selectedSeats, couponCode: appliedCoupon?.code || undefined, snacks: selectedSnacks, redeemPoints: pointsToRedeem || undefined },
        {headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success){
        window.location.href = data.url;
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
            </div>
          ))}
        </div>
      </div>

      {/*seat layout*/}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0px" right="0px" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        {selectedTime?.screen?.rows?.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-[11px] text-gray-400">
            {Object.entries(SEAT_TYPE_META).map(([type, { label, border, icon: SeatIcon }]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`relative h-4 w-4 rounded border ${border}`}>
                  {SeatIcon && <SeatIcon className="absolute inset-0 m-auto w-2.5 h-2.5" />}
                </span>
                {label}
              </div>
            ))}
          </div>
        )}

        <div className="w-full max-w-full overflow-x-auto">
          <div className="flex flex-col items-center mt-10 text-xs text-gray-300 gap-1 max-h-[60vh] overflow-y-auto py-1 w-max mx-auto">
            {(selectedTime?.screen?.rows || []).map((row) =>
              renderSeats(row.label, row.seatCount, row.seatType)
            )}
          </div>
        </div>

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
            <div className="flex items-center justify-between font-semibold mt-1 pt-1 border-t border-primary/20">
              <span>Total</span>
              <span>
                {currency}
                {ticketAmountAfterCoupon - pointsDiscount + snacksTotal}
              </span>
            </div>
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

        <button
          onClick={bookTickets}
          className="flex items-center gap-1 mt-6 px-10 py-3 text-sm bg-primary cursor-pointer active:scale-95"
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
