import React, { useMemo } from "react";
import { ActivityIcon, ShieldIcon, PlusCircleIcon, RefreshCwIcon, Trash2Icon, AlertTriangleIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const ActivityKpiRow = ({ entries }) => {
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let today = 0, adminActions = 0, created = 0, updated = 0, deleted = 0;

    entries.forEach((e) => {
      if (new Date(e.createdAt).toDateString() === todayStr) today += 1;
      if (e.actorRole === "superAdmin" || e.actorRole === "theaterAdmin") adminActions += 1;
      if (e.action === "create") created += 1;
      if (e.action === "update") updated += 1;
      if (e.action === "delete") deleted += 1;
    });

    return { today, adminActions, created, updated, deleted, failed: 0 };
  }, [entries]);

  const cards = [
    { icon: ActivityIcon, label: "Today's Events", value: stats.today, tone: "primary" },
    { icon: ShieldIcon, label: "Admin Actions", value: stats.adminActions, tone: "violet" },
    { icon: PlusCircleIcon, label: "Created", value: stats.created, tone: "primary" },
    { icon: RefreshCwIcon, label: "Updated", value: stats.updated, tone: "violet" },
    { icon: Trash2Icon, label: "Deleted", value: stats.deleted, tone: "primary" },
    { icon: AlertTriangleIcon, label: "Failed Events", value: stats.failed, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default ActivityKpiRow;
