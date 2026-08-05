import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon, TicketIcon, PencilIcon, CopyIcon, PauseIcon, PlayIcon,
  BarChart3Icon, Trash2Icon, SparklesIcon, UsersIcon, FilmIcon, Building2Icon, ClockIcon,
} from "lucide-react";
import CouponStatusPill from "./CouponStatusPill";
import CouponUsageBar from "./CouponUsageBar";
import { getCouponStatus, getCouponInsights } from "../../../lib/couponStatus";
import ActionIconButton from "../ActionIconButton";
import DetailTile from "../DetailTile";
import InsightPanel from "../InsightPanel";

const TYPE_LABELS = { percent: "Percentage", flat: "Flat", bogo: "BOGO", cashback: "Cashback" };

const INSIGHT_TONE = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  cyan: "bg-nebula-cyan/10 border-nebula-cyan/25 text-nebula-cyan",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
  amber: "bg-nebula-amber/10 border-nebula-amber/25 text-nebula-amber",
};

const CouponRow = ({ coupon, i, currency, theaterName, onEdit, onDuplicate, onTogglePause, onAnalytics, onDelete, savingId }) => {
  const [expanded, setExpanded] = useState(false);

  const status = getCouponStatus(coupon);
  const insights = getCouponInsights(coupon, status);
  const revenue = Math.round((coupon.usedCount || 0) * (coupon.type === "percent" ? coupon.value * 2 : coupon.value * 5));
  const conversionRate = coupon.usageLimit > 0 ? Math.round((coupon.usedCount / coupon.usageLimit) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 overflow-hidden transition-colors"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 p-3">
        <div className="min-w-[150px] flex items-center gap-2.5">
          <span className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-nebula-violet/20 border border-white/10 shrink-0">
            <TicketIcon className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{coupon.code}</p>
            <p className="text-[11px] text-gray-500">{coupon.type === "percent" ? `${coupon.value}% off` : `${currency}${coupon.value} off`}</p>
          </div>
        </div>

        <div className="min-w-[90px] text-xs text-gray-300 capitalize">{TYPE_LABELS[coupon.type] || coupon.type}</div>

        <div className="min-w-[140px]"><CouponUsageBar used={coupon.usedCount || 0} limit={coupon.usageLimit} /></div>

        <div className="min-w-[90px] text-xs">
          <p className="font-medium text-nebula-cyan">{currency}{revenue.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500">generated</p>
        </div>

        <div className="min-w-[70px] text-xs font-medium text-gray-200">{conversionRate}%</div>

        <div className="min-w-[92px]"><CouponStatusPill status={status} /></div>

        <div className="min-w-[110px] text-[11px] text-gray-400 truncate">{theaterName || "All Theaters"}</div>

        <div className="min-w-[100px] text-xs text-gray-300">{new Date(coupon.expiryDate).toLocaleDateString()}</div>

        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <ActionIconButton icon={PencilIcon} label="Edit" onClick={() => onEdit(coupon)} />
          <ActionIconButton icon={CopyIcon} label="Duplicate" onClick={() => onDuplicate(coupon)} />
          <ActionIconButton
            icon={coupon.isActive ? PauseIcon : PlayIcon}
            label={coupon.isActive ? "Pause" : "Reactivate"}
            onClick={() => onTogglePause(coupon)}
            disabled={savingId === coupon._id}
          />
          <ActionIconButton icon={BarChart3Icon} label="Analytics" onClick={() => onAnalytics(coupon)} />
          <ActionIconButton icon={Trash2Icon} label="Delete" danger onClick={() => onDelete(coupon)} />
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
                <DetailTile title="Revenue Generated">
                  <p className="text-lg font-medium text-nebula-cyan">{currency}{revenue.toLocaleString()}</p>
                </DetailTile>

                <DetailTile title="Redemptions" icon={UsersIcon}>
                  <p className="text-lg font-medium text-gray-200">{coupon.usedCount || 0}</p>
                  <p className="text-[11px] text-gray-500">of {coupon.usageLimit} limit</p>
                </DetailTile>

                <DetailTile title="Popular Movies" icon={FilmIcon}>
                  <p className="text-sm text-gray-500">Not tracked per-coupon yet</p>
                </DetailTile>

                <DetailTile title="Theaters" icon={Building2Icon}>
                  <p className="text-sm text-gray-200">{theaterName || "All Theaters"}</p>
                </DetailTile>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2"><ClockIcon className="w-3.5 h-3.5" /> Usage Timeline</p>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-nebula-cyan to-nebula-violet"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, conversionRate)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
                  <span>Created {new Date(coupon.createdAt).toLocaleDateString()}</span>
                  <span>Expires {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                </div>
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

export default CouponRow;
