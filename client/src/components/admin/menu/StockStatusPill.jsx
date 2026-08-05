import React from "react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  available: { label: "Available", emoji: "🟢", tone: "cyan" },
  low: { label: "Low Stock", emoji: "🟡", tone: "amber" },
  out: { label: "Out of Stock", emoji: "🔴", tone: "primary" },
};

const StockStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.available;
  return <StatusPill variant="emoji" label={meta.label} tone={meta.tone} emoji={meta.emoji} />;
};

export default StockStatusPill;
