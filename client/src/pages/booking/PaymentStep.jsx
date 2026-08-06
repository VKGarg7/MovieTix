import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { CreditCardIcon, ShieldCheckIcon, SmartphoneIcon, LandmarkIcon, WalletIcon, TicketIcon, GiftIcon, CoinsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import { playConfirm } from "../../lib/soundEngine";
import StepHeader from "../../components/cinematic/StepHeader";

const currency = import.meta.env.VITE_CURRENCY;

const PAYMENT_METHODS = [
  { key: "upi", label: "UPI", icon: SmartphoneIcon, hint: "Google Pay, PhonePe, Paytm" },
  { key: "card", label: "Credit/Debit Card", icon: CreditCardIcon, hint: "Visa, Mastercard, RuPay" },
  { key: "netbanking", label: "Net Banking", icon: LandmarkIcon, hint: "All major banks" },
  { key: "wallet", label: "Wallet", icon: WalletIcon, hint: "Paytm, Amazon Pay" },
];

const PaymentStep = () => {
  const { axios, getToken, user, selectedTheater } = useAppContext();
  const { state, back } = useBookingFlow();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsConfig, setPointsConfig] = useState(null);
  const [redeemPointsInput, setRedeemPointsInput] = useState("");
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [bingePassEligibility, setBingePassEligibility] = useState(null);
  const [useBingePassCredit, setUseBingePassCredit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get("/api/user/points", {
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || !state.time) return;
      try {
        const { data } = await axios.get(`/api/subscription/binge-pass/eligibility/${state.time.showId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          setBingePassEligibility(data);
          if (!data.eligible) setUseBingePassCredit(false);
        }
      } catch (error) {
        console.log(error);
      }
    };
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.time]);

  const selectedSnacks = state.menuItems
    .filter((item) => state.snackQuantities[item._id] > 0)
    .map((item) => ({ menuItemId: item._id, name: item.name, price: item.price, quantity: state.snackQuantities[item._id] }));
  const snacksTotal = selectedSnacks.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const ticketAmount = state.time ? state.time.computedPrice * state.selectedSeats.length : 0;
  const ticketAmountAfterCoupon = appliedCoupon ? appliedCoupon.finalAmount : ticketAmount;
  const pointsDiscount = pointsConfig
    ? Math.min(pointsToRedeem * pointsConfig.redemptionValue, ticketAmountAfterCoupon * pointsConfig.maxRedemptionFractionOfAmount)
    : 0;
  const bingePassDiscount = useBingePassCredit ? Math.min(ticketAmountAfterCoupon, ticketAmount) : 0;
  const convenienceFee = Math.round(ticketAmount * 0.02);
  const taxes = Math.round(ticketAmount * 0.05);
  const total = Math.max(0, ticketAmountAfterCoupon - pointsDiscount - bingePassDiscount) + snacksTotal + convenienceFee + taxes;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return toast.error("Enter a coupon code");
    setCouponLoading(true);
    try {
      const { data } = await axios.post(
        "/api/coupon/validate",
        { code: couponInput.trim(), theaterId: selectedTheater?._id, amount: ticketAmount },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalAmount: data.finalAmount });
        toast.success("Coupon applied");
      }
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || error.message);
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const applyPoints = () => {
    const requested = parseInt(redeemPointsInput, 10);
    if (!Number.isInteger(requested) || requested <= 0) return toast.error("Enter a valid number of points");
    if (requested > pointsBalance) return toast.error("You don't have that many points");
    setPointsToRedeem(requested);
    toast.success("Points applied");
  };

  const removePoints = () => {
    setPointsToRedeem(0);
    setRedeemPointsInput("");
  };

  const bookTickets = async () => {
    if (!user) return toast.error("Please login to book tickets");
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId: state.time.showId,
          selectedSeats: state.selectedSeats,
          couponCode: appliedCoupon?.code || undefined,
          snacks: selectedSnacks,
          redeemPoints: pointsToRedeem || undefined,
          useBingePassCredit,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        if (data.isPaid) {
          playConfirm();
          toast.success("Booking confirmed with Binge Pass credit!");
          navigate("/my-bookings");
        } else if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  return (
    <div>
      <StepHeader step={6} title="Review & Pay" />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* left: payment methods */}
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
            <p className="text-sm font-medium mb-4">Payment Method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.key;
                return (
                  <motion.button
                    key={method.key}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod(method.key)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    }`}
                    style={isSelected ? { boxShadow: "0 0 22px -8px rgba(248,69,101,0.6)" } : undefined}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-primary" : "bg-white/[0.06] border border-white/10"}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{method.hint}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2"><TicketIcon className="w-4 h-4 text-primary" /> Apply Coupon</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-sm">
                  <span><span className="font-medium text-primary">{appliedCoupon.code}</span> applied</span>
                  <button onClick={removeCoupon} className="text-gray-400 text-xs cursor-pointer hover:text-white transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 glass-input"
                  />
                  <button onClick={applyCoupon} disabled={couponLoading} className="px-4 py-2 text-sm bg-white/10 hover:bg-primary transition-colors rounded-full cursor-pointer disabled:opacity-50">
                    Apply
                  </button>
                </div>
              )}
            </div>

            {pointsBalance > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2"><CoinsIcon className="w-4 h-4 text-primary" /> Loyalty Points</p>
                {pointsToRedeem > 0 ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-sm">
                    <span><span className="font-medium text-primary">{pointsToRedeem} points</span> applied</span>
                    <button onClick={removePoints} className="text-gray-400 text-xs cursor-pointer hover:text-white transition-colors">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={pointsBalance}
                      placeholder={`Redeem (${pointsBalance} available)`}
                      value={redeemPointsInput}
                      onChange={(e) => setRedeemPointsInput(e.target.value)}
                      className="flex-1 glass-input"
                    />
                    <button onClick={applyPoints} className="px-4 py-2 text-sm bg-white/10 hover:bg-primary transition-colors rounded-full cursor-pointer">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

            {bingePassEligibility?.eligible && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2"><GiftIcon className="w-4 h-4 text-primary" /> Binge Pass</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useBingePassCredit} onChange={(e) => setUseBingePassCredit(e.target.checked)} className="cursor-pointer" />
                  <span>
                    Use a Binge Pass credit
                    <span className="text-gray-400 text-xs ml-1">({bingePassEligibility.creditsRemaining} remaining)</span>
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-2 border-t border-white/10">
              <ShieldCheckIcon className="w-4 h-4" />
              Secure checkout via Stripe
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <button onClick={back} className="px-6 py-3 text-sm rounded-full font-medium cursor-pointer border border-white/15 hover:bg-white/5 transition-colors">
              Back
            </button>
          </div>
        </div>

        {/* right: order summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-6 h-max lg:sticky lg:top-28"
        >
          <p className="text-sm font-medium mb-3">Order Summary</p>
          <div className="text-sm space-y-2 text-gray-300">
            <div className="flex justify-between"><span>Movie</span><span className="text-white text-right">{state.movie?.title}</span></div>
            <div className="flex justify-between"><span>Theater</span><span className="text-white text-right">{state.theater?.name}</span></div>
            <div className="flex justify-between"><span>Date</span><span className="text-white">{state.date}</span></div>
            <div className="flex justify-between"><span>Seats</span><span className="text-white">{state.selectedSeats.join(", ")}</span></div>
            {selectedSnacks.length > 0 && (
              <div className="flex justify-between"><span>Food</span><span className="text-white text-right">{selectedSnacks.map((s) => `${s.name} x${s.quantity}`).join(", ")}</span></div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>{state.selectedSeats.length} seat{state.selectedSeats.length > 1 ? "s" : ""} × {currency}{state.time?.computedPrice}</span>
              <span>{currency}{ticketAmount}</span>
            </div>
            {snacksTotal > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>Snacks</span>
                <span>{currency}{snacksTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-300">
              <span>Convenience fee</span>
              <span>{currency}{convenienceFee}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Taxes</span>
              <span>{currency}{taxes}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-primary">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-{currency}{appliedCoupon.discountAmount}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Points ({pointsToRedeem})</span>
                <span>-{currency}{pointsDiscount}</span>
              </div>
            )}
            {bingePassDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Binge Pass credit</span>
                <span>-{currency}{bingePassDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-white/10">
              <span>Total</span>
              <motion.span key={total} initial={{ scale: 1.15, color: "#F84565" }} animate={{ scale: 1, color: "#FFFFFF" }} transition={{ duration: 0.4 }}>
                {currency}{total}
              </motion.span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={bookTickets}
            disabled={submitting}
            className="btn-glow w-full mt-6 flex items-center justify-center gap-2 px-9 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10 disabled:opacity-50"
          >
            <CreditCardIcon className="w-4 h-4" />
            {submitting ? "Processing..." : `Pay ${currency}${total}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentStep;
