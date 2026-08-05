import React, { useMemo } from "react";
import { ZapIcon, ActivityIcon, TrendingUpIcon, ReceiptIcon, CalendarIcon, ClockIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import { estimateMonthlyRevenueImpact } from "../../../lib/pricingRuleStatus";

const renderMultiplier = (value) => (
  <p className="text-2xl font-display font-medium tabular-nums">×{value.toFixed(2)}</p>
);

const PricingKpiRow = ({ rules, currency }) => {
  const stats = useMemo(() => {
    const active = rules.filter((r) => r.isActive).length;
    const dynamic = rules.filter((r) => r.type === 'early_bird').length;
    const revenueGain = rules.reduce((sum, r) => sum + Math.max(0, estimateMonthlyRevenueImpact(r)), 0);

    const weekendRules = rules.filter((r) => r.type === 'time_of_week' && (r.daysOfWeek || []).some((d) => d === 5 || d === 6));
    const weekendMultiplier = weekendRules.length > 0
      ? 1 + weekendRules.reduce((sum, r) => sum + r.adjustmentPercent, 0) / weekendRules.length / 100
      : 1;

    const peakRules = rules.filter((r) => r.type === 'time_of_week' && (r.startHour ?? 0) >= 18);
    const peakMultiplier = peakRules.length > 0
      ? 1 + peakRules.reduce((sum, r) => sum + r.adjustmentPercent, 0) / peakRules.length / 100
      : 1;

    return {
      active,
      dynamic,
      revenueGain,
      avgTicket: 250,
      weekendMultiplier: Math.round(weekendMultiplier * 100) / 100,
      peakMultiplier: Math.round(peakMultiplier * 100) / 100,
    };
  }, [rules]);

  const cards = [
    { icon: ZapIcon, label: "Active Rules", value: stats.active, tone: "primary" },
    { icon: ActivityIcon, label: "Dynamic Rules", value: stats.dynamic, tone: "violet" },
    { icon: TrendingUpIcon, label: "Revenue Increase", value: stats.revenueGain, prefix: currency, tone: "primary" },
    { icon: ReceiptIcon, label: "Average Ticket Price", value: stats.avgTicket, prefix: currency, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} prefix={c.prefix} tone={c.tone} i={i} />
      ))}
      <KpiCard icon={CalendarIcon} label="Weekend Multiplier" value={stats.weekendMultiplier} tone="primary" i={4} renderValue={renderMultiplier} />
      <KpiCard icon={ClockIcon} label="Peak Hour Multiplier" value={stats.peakMultiplier} tone="violet" i={5} renderValue={renderMultiplier} />
    </div>
  );
};

export default PricingKpiRow;
