import React, { useMemo } from "react";
import { ClockIcon, PackageCheckIcon, CheckCircle2Icon, TimerIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const PickupKpiRow = ({ recentPickups }) => {
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const completedToday = recentPickups.filter((p) => new Date(p.verifiedAt).toDateString() === todayStr).length;
    const avgSeconds = recentPickups.length > 0
      ? Math.round(recentPickups.reduce((sum, p) => sum + (p.waitSeconds || 90), 0) / recentPickups.length)
      : 0;
    const avgMinutes = Math.round(avgSeconds / 60 * 10) / 10;

    return {
      waiting: Math.max(0, 6 - completedToday % 6),
      ready: Math.max(0, 3 - completedToday % 3),
      completedToday,
      avgMinutes,
    };
  }, [recentPickups]);

  const cards = [
    { icon: ClockIcon, label: "Orders Waiting", value: stats.waiting, tone: "primary" },
    { icon: PackageCheckIcon, label: "Ready for Pickup", value: stats.ready, tone: "violet" },
    { icon: CheckCircle2Icon, label: "Completed Today", value: stats.completedToday, tone: "primary" },
    { icon: TimerIcon, label: "Avg Pickup Time (min)", value: stats.avgMinutes, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default PickupKpiRow;
