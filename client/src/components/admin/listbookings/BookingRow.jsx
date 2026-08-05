import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon, StarIcon, MailIcon, PhoneIcon, Building2Icon, MonitorPlayIcon,
  EyeIcon, PrinterIcon, FileDownIcon, RotateCcwIcon, Trash2Icon, SparklesIcon,
  CheckCircle2Icon, CircleIcon, PopcornIcon, TicketPercentIcon, QrCodeIcon, ClockIcon,
} from "lucide-react";
import { dateFormat } from "../../../lib/dateFomat";
import BookingStatusPill from "./BookingStatusPill";
import PaymentStatusPill from "./PaymentStatusPill";
import SeatChips from "./SeatChips";
import { getBookingStatus, getPaymentStatus } from "../../../lib/bookingStatus";
import { getBookingInsights } from "../../../lib/bookingInsights";
import ActionIconButton from "../ActionIconButton";
import DetailTile from "../DetailTile";
import InsightPanel from "../InsightPanel";

const INSIGHT_TONE = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  cyan: "bg-nebula-cyan/10 border-nebula-cyan/25 text-nebula-cyan",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
  amber: "bg-nebula-amber/10 border-nebula-amber/25 text-nebula-amber",
};

const TIMELINE_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "payment", label: "Payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checkedIn", label: "Checked In" },
  { key: "completed", label: "Completed" },
];

const BookingTimeline = ({ booking }) => {
  const status = getBookingStatus(booking);
  const stepIndex = {
    pending: 1,
    confirmed: 2,
    "checked-in": 3,
    completed: 4,
    cancelled: booking.isPaid ? 1 : 0,
    refunded: 2,
  }[status] ?? (booking.isPaid ? 2 : 0);

  return (
    <div className="flex items-center">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= stepIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                {done ? (
                  <CheckCircle2Icon className="w-4 h-4 text-nebula-cyan" />
                ) : (
                  <CircleIcon className="w-4 h-4 text-gray-600" />
                )}
              </motion.div>
              <span className={`text-[10px] whitespace-nowrap ${done ? "text-gray-300" : "text-gray-600"}`}>{step.label}</span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
                className={`h-px flex-1 mx-1 origin-left ${i < stepIndex ? "bg-nebula-cyan/50" : "bg-white/10"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const BookingRow = ({ booking, i, currency, imageBaseUrl, customerBookingCount, onView, onPrint, onInvoice, onRefund, onDelete, savingId }) => {
  const [expanded, setExpanded] = useState(false);

  const status = getBookingStatus(booking);
  const paymentStatus = getPaymentStatus(booking);
  const show = booking.show;
  const movie = show?.movie;
  const seats = (booking.bookedSeats || []).map((s) => (typeof s === "string" ? s : s?.seatId || s?.label || String(s)));
  const insights = getBookingInsights(booking, customerBookingCount);
  const bookingId = booking._id?.slice(-8).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 overflow-hidden transition-colors"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 p-3">
        <div className="min-w-[150px] flex items-center gap-2">
          <img
            src={booking.user?.image || "/logo.svg"}
            alt=""
            loading="lazy"
            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{booking.user?.name || "Unknown user"}</p>
            <p className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
              <MailIcon className="w-2.5 h-2.5 shrink-0" /> {booking.user?.email || "—"}
            </p>
          </div>
        </div>

        <div className="min-w-[36px] text-[10px] text-gray-500 font-mono">#{bookingId}</div>

        {movie ? (
          <div className="min-w-[42px]">
            <div className="w-8 h-11 rounded-md overflow-hidden border border-white/10">
              <img src={imageBaseUrl + (movie.poster_path || movie.backdrop_path)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="min-w-[42px]" />
        )}

        <div className="min-w-[160px] flex-1 max-w-[210px]">
          {movie ? (
            <>
              <p className="text-sm font-medium truncate">{movie.title}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                {movie.genres?.[0]?.name && <span className="truncate">{movie.genres[0].name}</span>}
                {movie.runtime && <span>· {movie.runtime}m</span>}
                {movie.original_language && <span className="uppercase">· {movie.original_language}</span>}
                {movie.vote_average > 0 && (
                  <span className="flex items-center gap-0.5 text-nebula-amber">
                    <StarIcon className="w-2.5 h-2.5 fill-current" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/15 text-gray-400">
              Archived Show
            </span>
          )}
        </div>

        <div className="min-w-[130px] text-xs text-gray-300">
          <p className="flex items-center gap-1 truncate">
            <Building2Icon className="w-3 h-3 text-gray-500 shrink-0" />
            {show?.screen?.theater?.name || "—"}
          </p>
          <p className="flex items-center gap-1 text-gray-500 text-[11px] mt-0.5 truncate">
            <MonitorPlayIcon className="w-3 h-3 shrink-0" />
            {show?.screen?.name || "—"}
          </p>
        </div>

        <div className="min-w-[140px] text-xs text-gray-300">{show?.showDateTime ? dateFormat(show.showDateTime) : "—"}</div>

        <div className="min-w-[110px]"><SeatChips seats={seats} /></div>

        <div className="min-w-[90px] text-xs">
          <p className="font-medium text-nebula-cyan">{currency}{booking.amount?.toLocaleString()}</p>
          <p className="flex items-center gap-1 text-[10px] text-gray-500">
            <ClockIcon className="w-2.5 h-2.5" /> {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="min-w-[92px]"><BookingStatusPill status={status} /></div>
        <div className="min-w-[86px]"><PaymentStatusPill status={paymentStatus} /></div>

        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <ActionIconButton icon={EyeIcon} label="View" onClick={() => { setExpanded((v) => !v); onView?.(booking); }} />
          <ActionIconButton icon={PrinterIcon} label="Print Ticket" onClick={() => onPrint?.(booking)} />
          <ActionIconButton icon={FileDownIcon} label="Download Invoice" onClick={() => onInvoice?.(booking)} />
          <ActionIconButton icon={RotateCcwIcon} label="Refund" onClick={() => onRefund?.(booking)} disabled={!booking.isPaid || status === "cancelled" || status === "refunded"} />
          <ActionIconButton icon={Trash2Icon} label="Delete" danger onClick={() => onDelete?.(booking)} disabled={savingId === booking._id} />
        </div>

        <motion.button
          animate={{ rotate: expanded ? 180 : 0 }}
          onClick={() => setExpanded((v) => !v)}
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer shrink-0"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-4 bg-white/[0.015]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailTile title="Customer">
                  <p className="text-sm font-medium text-gray-200">{booking.user?.name || "Unknown"}</p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-400"><MailIcon className="w-3 h-3" /> {booking.user?.email || "—"}</p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-400"><PhoneIcon className="w-3 h-3" /> Not on file</p>
                </DetailTile>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col items-center justify-center gap-1.5">
                  <QrCodeIcon className="w-12 h-12 text-gray-300" strokeWidth={1.2} />
                  <p className="text-[10px] text-gray-500 font-mono">#{bookingId}</p>
                </div>

                <DetailTile title="Food Order" icon={PopcornIcon}>
                  {booking.snacks?.length > 0 ? (
                    <p className="text-sm font-medium text-gray-200">
                      {booking.snacks.map((s) => `${s.name} ×${s.quantity}`).join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">No food ordered</p>
                  )}
                </DetailTile>

                <DetailTile title="Coupons" icon={TicketPercentIcon}>
                  <p className="text-sm font-medium text-gray-200">{booking.couponCode || "None"}</p>
                  {booking.discountAmount > 0 && (
                    <p className="text-[11px] text-nebula-cyan">-{currency}{booking.discountAmount} discount</p>
                  )}
                </DetailTile>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] text-gray-500 mb-3">Booking Timeline</p>
                <BookingTimeline booking={booking} />
              </div>

              {insights.length > 0 && (
                <InsightPanel icon={SparklesIcon}>
                  <div className="flex flex-wrap items-start gap-2">
                    {insights.map((ins) => (
                      <span key={ins.label} className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${INSIGHT_TONE[ins.tone]}`}>
                        {ins.label}
                      </span>
                    ))}
                  </div>
                </InsightPanel>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingRow;
