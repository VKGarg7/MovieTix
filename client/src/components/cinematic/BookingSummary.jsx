import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";

const currency = import.meta.env.VITE_CURRENCY;

const BookingSummary = ({
  selectedSeats,
  selectedTime,
  ticketAmount,
  snacksTotal,
  pointsDiscount,
  pointsToRedeem,
  bingePassDiscount,
  appliedCoupon,
  total,
  onCheckout,
  disabled,
}) => {
  if (selectedSeats.length === 0 || !selectedTime) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xs glass-panel p-5 relative overflow-hidden"
      style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 30px 70px -20px rgba(0,0,0,0.8), 0 0 50px -15px rgba(248,69,101,0.25)" }}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #F84565, transparent 70%)" }} />

      <p className="section-eyebrow mb-3">Your Selection</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <AnimatePresence>
          {selectedSeats.map((seat) => (
            <motion.span
              key={seat}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="px-2 py-1 rounded-full text-[11px] bg-primary/20 border border-primary/40 text-primary font-medium"
            >
              {seat}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-sm space-y-1.5">
        <div className="flex items-center justify-between text-gray-300">
          <span>
            {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} × {currency}{selectedTime.computedPrice}
            {selectedTime.computedPrice !== selectedTime.showPrice && (
              <span className="text-primary text-xs ml-1">(dynamic)</span>
            )}
          </span>
          <motion.span key={ticketAmount} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
            {currency}{ticketAmount}
          </motion.span>
        </div>
        {snacksTotal > 0 && (
          <div className="flex items-center justify-between text-gray-300">
            <span>Snacks</span>
            <motion.span key={snacksTotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
              {currency}{snacksTotal}
            </motion.span>
          </div>
        )}
        {appliedCoupon && (
          <div className="flex items-center justify-between text-primary">
            <span>Coupon ({appliedCoupon.code})</span>
            <span>-{currency}{appliedCoupon.discountAmount}</span>
          </div>
        )}
        {pointsDiscount > 0 && (
          <div className="flex items-center justify-between text-primary">
            <span>Points ({pointsToRedeem})</span>
            <span>-{currency}{pointsDiscount}</span>
          </div>
        )}
        {bingePassDiscount > 0 && (
          <div className="flex items-center justify-between text-primary">
            <span>Binge Pass credit</span>
            <span>-{currency}{bingePassDiscount}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-semibold text-base mt-2 pt-2 border-t border-white/10">
          <span>Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.15, color: "#F84565" }}
            animate={{ scale: 1, color: "#FFFFFF" }}
            transition={{ duration: 0.4 }}
          >
            {currency}{total}
          </motion.span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCheckout}
        disabled={disabled}
        className="btn-glow w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-sm rounded-full font-medium cursor-pointer border border-white/10 disabled:opacity-40 disabled:pointer-events-none"
      >
        Proceed to Checkout
        <ArrowRightIcon strokeWidth={2.5} className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default BookingSummary;
