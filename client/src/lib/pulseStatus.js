export const occupancyTier = (pct) => {
  if (pct === null || pct === undefined) return { tier: "unknown", color: "#6b7280", from: "#6b7280", to: "#6b7280" };
  if (pct < 25) return { tier: "low", color: "#3FD8E0", from: "#3FD8E0", to: "#6D5CFF" };
  if (pct < 50) return { tier: "mid", color: "#22c55e", from: "#22c55e", to: "#3FD8E0" };
  if (pct < 75) return { tier: "high", color: "#FFB86B", from: "#FFB86B", to: "#F84565" };
  return { tier: "critical", color: "#F84565", from: "#F84565", to: "#D63854" };
};

export const getLiveStatus = (show, now) => {
  const start = new Date(show.showDateTime).getTime();
  const pct = show.occupancyPct ?? 0;
  const minutesToStart = (start - now) / 60000;

  if (pct >= 100) return "sold-out";
  if (pct >= 85) return "almost-full";
  if (minutesToStart < 180 && pct >= 40) return "booking-fast";
  if (pct < 15 && minutesToStart < 120) return "low-demand";
  return "on-track";
};

const STATUS_META = {
  "sold-out": { label: "Sold Out", cls: "bg-primary/10 border-primary/30 text-primary" },
  "almost-full": { label: "Almost Full", cls: "bg-nebula-amber/10 border-nebula-amber/30 text-nebula-amber" },
  "booking-fast": { label: "Booking Fast", cls: "bg-nebula-cyan/10 border-nebula-cyan/30 text-nebula-cyan" },
  "low-demand": { label: "Low Demand", cls: "bg-white/5 border-white/15 text-gray-400" },
  "on-track": { label: "On Track", cls: "bg-nebula-violet/10 border-nebula-violet/30 text-nebula-violet" },
};

export const getStatusMeta = (status) => STATUS_META[status] || STATUS_META["on-track"];

export const buildOperationsAlerts = (shows, now) => {
  const alerts = [];
  const highDemand = shows.filter((s) => getLiveStatus(s, now) === "almost-full" || getLiveStatus(s, now) === "sold-out");
  if (highDemand.length > 0) {
    alerts.push({ label: `High demand detected on ${highDemand.length} show${highDemand.length > 1 ? "s" : ""} — consider opening an additional counter`, tone: "primary" });
  }
  const lowDemand = shows.filter((s) => getLiveStatus(s, now) === "low-demand");
  if (lowDemand.length > 0) {
    alerts.push({ label: `Low occupancy on ${lowDemand.length} show${lowDemand.length > 1 ? "s" : ""} — consider a targeted discount`, tone: "amber" });
  }
  const soonStarting = shows.filter((s) => {
    const minsToStart = (new Date(s.showDateTime).getTime() - now) / 60000;
    return minsToStart > 0 && minsToStart < 30 && (s.occupancyPct ?? 0) >= 70;
  });
  if (soonStarting.length >= 2) {
    alerts.push({ label: "Multiple high-occupancy shows starting soon — possible staff shortage at counters", tone: "violet" });
  }
  if (alerts.length === 0) {
    alerts.push({ label: "All screens operating normally — no alerts", tone: "violet" });
  }
  return alerts;
};
