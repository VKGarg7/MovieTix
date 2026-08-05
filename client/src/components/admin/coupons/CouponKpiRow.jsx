import React, { useMemo } from "react";
import { TicketIcon, TimerOffIcon, RepeatIcon, BanknoteIcon, PercentIcon, TrendingUpIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import { getCouponStatus } from "../../../lib/couponStatus";

const CouponKpiRow = ({ coupons, currency }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0, expired = 0, redemptions = 0, revenue = 0, valueSum = 0, valueCount = 0;

    coupons.forEach((c) => {
      const status = getCouponStatus(c, now);
      if (status === "active") active += 1;
      if (status === "expired") expired += 1;
      redemptions += c.usedCount || 0;
      revenue += (c.usedCount || 0) * (c.type === "percent" ? c.value * 2 : c.value * 5);
      valueSum += c.value || 0;
      valueCount += 1;
    });

    const totalCapacity = coupons.reduce((sum, c) => sum + (c.usageLimit || 0), 0);

    return {
      active,
      expired,
      redemptions,
      revenue: Math.round(revenue),
      avgDiscount: valueCount > 0 ? Math.round(valueSum / valueCount) : 0,
      conversionRate: totalCapacity > 0 ? Math.round((redemptions / totalCapacity) * 100) : 0,
    };
  }, [coupons]);

  const cards = [
    { icon: TicketIcon, label: "Active Coupons", value: stats.active, tone: "primary" },
    { icon: TimerOffIcon, label: "Expired Coupons", value: stats.expired, tone: "violet" },
    { icon: RepeatIcon, label: "Total Redemptions", value: stats.redemptions, tone: "primary" },
    { icon: BanknoteIcon, label: "Revenue Influenced", value: stats.revenue, prefix: currency, tone: "violet" },
    { icon: PercentIcon, label: "Average Discount", value: stats.avgDiscount, tone: "primary" },
    { icon: TrendingUpIcon, label: "Conversion Rate", value: stats.conversionRate, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} prefix={c.prefix} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default CouponKpiRow;
