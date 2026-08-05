import React, { useMemo } from "react";
import { GaugeIcon, UsersIcon, PlayCircleIcon, CalendarClockIcon, BanknoteIcon, TrendingUpIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const PulseKpiRow = ({ shows, currency, now }) => {
  const stats = useMemo(() => {
    let running = 0, upcoming = 0, revenue = 0, occSum = 0, occCount = 0, visitors = 0, peak = 0;

    shows.forEach((s) => {
      const start = new Date(s.showDateTime).getTime();
      const end = start + (s.runtime ? s.runtime * 60000 : 3 * 60 * 60000);
      if (now >= start && now <= end) running += 1;
      if (start > now) upcoming += 1;
      revenue += s.revenue || 0;
      visitors += s.occupiedCount || 0;
      if (s.occupancyPct !== null && s.occupancyPct !== undefined) {
        occSum += s.occupancyPct;
        occCount += 1;
        peak = Math.max(peak, s.occupancyPct);
      }
    });

    return {
      currentOccupancy: occCount > 0 ? Math.round(occSum / occCount) : 0,
      visitors,
      running,
      upcoming,
      revenue: Math.round(revenue),
      peak: Math.round(peak),
    };
  }, [shows, now]);

  const cards = [
    { icon: GaugeIcon, label: "Current Occupancy", value: stats.currentOccupancy, tone: "primary" },
    { icon: UsersIcon, label: "Today's Visitors", value: stats.visitors, tone: "violet" },
    { icon: PlayCircleIcon, label: "Shows Running", value: stats.running, tone: "primary" },
    { icon: CalendarClockIcon, label: "Upcoming Shows", value: stats.upcoming, tone: "violet" },
    { icon: BanknoteIcon, label: "Revenue Today", value: stats.revenue, prefix: currency, tone: "primary" },
    { icon: TrendingUpIcon, label: "Peak Occupancy", value: stats.peak, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} prefix={c.prefix} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default PulseKpiRow;
