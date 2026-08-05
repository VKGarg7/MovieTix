import React, { useMemo } from "react";
import { FilmIcon, CalendarClockIcon, PlayCircleIcon, BanknoteIcon, GaugeIcon, ClockIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const ShowKpiRow = ({ shows, currency, now }) => {
  const stats = useMemo(() => {
    const todayStr = new Date(now).toDateString();
    let todayShows = 0, running = 0, todayRevenue = 0, upcoming = 0, occSum = 0, occCount = 0;

    shows.forEach((show) => {
      const start = new Date(show.showDateTime);
      const occupied = Object.keys(show.occupiedSeats || {}).length;
      const capacity = show.screen?.totalCapacity || 0;
      const isToday = start.toDateString() === todayStr;
      if (isToday) {
        todayShows += 1;
        todayRevenue += occupied * show.showPrice;
      }
      const end = start.getTime() + (show.movie?.runtime ? show.movie.runtime * 60000 : 3 * 60 * 60000);
      if (now >= start.getTime() && now <= end && !show.isCancelled) running += 1;
      if (start.getTime() > now && !show.isCancelled) upcoming += 1;
      if (capacity > 0) {
        occSum += (occupied / capacity) * 100;
        occCount += 1;
      }
    });

    return {
      total: shows.length,
      todayShows,
      running,
      todayRevenue,
      avgOccupancy: occCount > 0 ? Math.round(occSum / occCount) : 0,
      upcoming,
    };
  }, [shows, now]);

  const cards = [
    { icon: FilmIcon, label: "Total Shows", value: stats.total, tone: "primary" },
    { icon: CalendarClockIcon, label: "Today's Shows", value: stats.todayShows, tone: "violet" },
    { icon: PlayCircleIcon, label: "Running Shows", value: stats.running, tone: "primary" },
    { icon: BanknoteIcon, label: "Today's Revenue", value: stats.todayRevenue, prefix: currency, tone: "violet" },
    { icon: GaugeIcon, label: "Avg Occupancy", value: stats.avgOccupancy, prefix: "", tone: "primary" },
    { icon: ClockIcon, label: "Upcoming Shows", value: stats.upcoming, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} prefix={c.prefix} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default ShowKpiRow;
