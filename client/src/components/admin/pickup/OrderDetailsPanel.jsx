import React from "react";
import { motion } from "framer-motion";
import { HashIcon, ClockIcon, MonitorPlayIcon, CheckCircle2Icon, CreditCardIcon, ScanLineIcon } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { dateFormat } from "../../../lib/dateFomat";
import { foodEmoji } from "../../../lib/foodEmoji";

const PAYMENT_LABEL = "Paid";

const OrderDetailsPanel = ({ order, snacks, currency, onScanNext }) => {
  const initials = (order.customerName || "?").slice(0, 1).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel !rounded-3xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {order.customerImage ? (
            <img src={order.customerImage} alt="" className="w-11 h-11 rounded-full object-cover border border-white/10" />
          ) : (
            <span className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-nebula-violet/30 border border-white/10 text-sm font-semibold">
              {initials}
            </span>
          )}
          <div>
            <p className="text-sm font-medium">{order.customerName}</p>
            <p className="text-[11px] text-gray-500 font-mono">#{order.bookingId?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <OrderStatusBadge status="picked-up" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><HashIcon className="w-3 h-3" /> Order Number</p>
          <p className="text-gray-200 font-mono">{order.bookingId?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><ClockIcon className="w-3 h-3" /> Booking Time</p>
          <p className="text-gray-200">{order.createdAt ? dateFormat(order.createdAt) : "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><MonitorPlayIcon className="w-3 h-3" /> Movie / Screen</p>
          <p className="text-gray-200 truncate">{order.movieTitle || "—"} · {order.screenName || "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><CreditCardIcon className="w-3 h-3" /> Payment</p>
          <p className="flex items-center gap-1 text-nebula-cyan font-medium">
            <CheckCircle2Icon className="w-3 h-3" /> {PAYMENT_LABEL}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Food Items</p>
        <div className="space-y-2">
          {(snacks || []).map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{foodEmoji(s.name)}</span>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-gray-500">Qty {s.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-nebula-cyan">{currency}{s.price * s.quantity}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onScanNext}
        className="btn-glow w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet text-white cursor-pointer"
      >
        <ScanLineIcon className="w-4 h-4" />
        Scan Next Customer
      </motion.button>
    </motion.div>
  );
};

export default OrderDetailsPanel;
