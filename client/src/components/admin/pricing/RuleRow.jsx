import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon, ZapIcon, PencilIcon, CopyIcon, PauseIcon, PlayIcon,
  BarChart3Icon, Trash2Icon, SparklesIcon, Building2Icon, ClockIcon, CheckCircle2Icon, CircleIcon,
} from "lucide-react";
import RuleStatusPill from "./RuleStatusPill";
import AdjustmentBadge from "./AdjustmentBadge";
import { getRuleStatus, getRuleConditionPills, estimateMonthlyRevenueImpact, getRuleInsights } from "../../../lib/pricingRuleStatus";
import ActionIconButton from "../ActionIconButton";
import DetailTile from "../DetailTile";
import InsightPanel from "../InsightPanel";
import { INSIGHT_TONE_CLASSES } from "../../../lib/insightTones";

const TYPE_LABELS = { time_of_week: "Time-of-week", early_bird: "Early-bird" };

const TIMELINE_EVENTS = (rule) => {
  const events = [{ label: "Created", date: rule.createdAt }];
  if (rule.updatedAt && rule.updatedAt !== rule.createdAt) {
    events.push({ label: rule.isActive ? "Updated" : "Paused", date: rule.updatedAt });
  }
  return events;
};

const RuleRow = ({ rule, i, currency, theaterName, onEdit, onDuplicate, onTogglePause, onAnalytics, onDelete, savingId }) => {
  const [expanded, setExpanded] = useState(false);

  const status = getRuleStatus(rule);
  const conditions = getRuleConditionPills(rule);
  const revenueImpact = estimateMonthlyRevenueImpact(rule);
  const insights = getRuleInsights(rule);
  const timeline = TIMELINE_EVENTS(rule);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 overflow-hidden transition-colors"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 p-3">
        <div className="min-w-[170px] flex items-center gap-2.5">
          <span className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-nebula-violet/20 border border-white/10 shrink-0">
            <ZapIcon className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{rule.name}</p>
            <p className="text-[11px] text-gray-500">{TYPE_LABELS[rule.type] || rule.type}</p>
          </div>
        </div>

        <div className="min-w-[190px] flex-1 max-w-[240px] flex flex-wrap gap-1">
          {conditions.map((c) => (
            <span key={c} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-gray-300">
              {c}
            </span>
          ))}
        </div>

        <div className="min-w-[80px]"><AdjustmentBadge percent={rule.adjustmentPercent} /></div>

        <div className="min-w-[50px] text-xs text-gray-400">P{rule.priority ?? 0}</div>

        <div className="min-w-[130px] text-xs">
          <p className={`font-medium ${revenueImpact >= 0 ? "text-nebula-cyan" : "text-primary"}`}>
            {revenueImpact >= 0 ? "+" : ""}{currency}{Math.abs(revenueImpact).toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500">Est. monthly {revenueImpact >= 0 ? "gain" : "loss"}</p>
        </div>

        <div className="min-w-[92px]"><RuleStatusPill status={status} /></div>

        <div className="min-w-[100px] text-xs text-gray-300">{new Date(rule.createdAt).toLocaleDateString()}</div>

        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <ActionIconButton icon={PencilIcon} label="Edit" onClick={() => onEdit(rule)} />
          <ActionIconButton icon={CopyIcon} label="Duplicate" onClick={() => onDuplicate(rule)} />
          <ActionIconButton
            icon={rule.isActive ? PauseIcon : PlayIcon}
            label={rule.isActive ? "Pause" : "Activate"}
            onClick={() => onTogglePause(rule)}
            disabled={savingId === rule._id}
          />
          <ActionIconButton icon={BarChart3Icon} label="Analytics" onClick={() => onAnalytics(rule)} />
          <ActionIconButton icon={Trash2Icon} label="Delete" danger onClick={() => onDelete(rule)} disabled={savingId === rule._id} />
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailTile title="Applicable Theaters" icon={Building2Icon}>
                  <p className="text-sm text-gray-200">{theaterName || "All Theaters (Global)"}</p>
                </DetailTile>

                <DetailTile title="Historical Revenue Impact">
                  <p className={`text-lg font-medium ${revenueImpact >= 0 ? "text-nebula-cyan" : "text-primary"}`}>
                    {revenueImpact >= 0 ? "+" : ""}{currency}{Math.abs(revenueImpact).toLocaleString()}
                  </p>
                </DetailTile>

                <DetailTile title="Applicable Movies">
                  <p className="text-sm text-gray-500">Not scoped per-movie yet</p>
                </DetailTile>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-3"><ClockIcon className="w-3.5 h-3.5" /> Rule Timeline</p>
                <div className="flex items-center">
                  {timeline.map((ev, idx) => (
                    <React.Fragment key={ev.label}>
                      <div className="flex flex-col items-center gap-1">
                        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.08 }}>
                          <CheckCircle2Icon className="w-4 h-4 text-nebula-cyan" />
                        </motion.div>
                        <span className="text-[10px] text-gray-300 whitespace-nowrap">{ev.label}</span>
                        <span className="text-[9px] text-gray-600">{new Date(ev.date).toLocaleDateString()}</span>
                      </div>
                      {idx < timeline.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: idx * 0.08 + 0.1 }}
                          className="h-px flex-1 mx-1 origin-left bg-nebula-cyan/50"
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {!rule.isActive && (
                    <>
                      <div className="h-px flex-1 mx-1 bg-white/10" />
                      <div className="flex flex-col items-center gap-1">
                        <CircleIcon className="w-4 h-4 text-nebula-amber" />
                        <span className="text-[10px] text-gray-300">Paused</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {insights.length > 0 && (
                <InsightPanel icon={SparklesIcon}>
                  <div className="flex flex-wrap items-start gap-2">
                    {insights.map((ins) => (
                      <span key={ins.label} className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${INSIGHT_TONE_CLASSES[ins.tone]}`}>
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

export default RuleRow;
