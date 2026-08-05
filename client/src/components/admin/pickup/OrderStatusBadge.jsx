import React from "react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  preparing: { label: "Preparing", tone: "amber" },
  ready: { label: "Ready", tone: "cyan", pulse: true },
  "picked-up": { label: "Picked Up", tone: "neutralLight" },
  expired: { label: "Expired", tone: "primary" },
};

const OrderStatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.ready;
  return (
    <StatusPill
      label={meta.label}
      tone={meta.tone}
      pulse={Boolean(meta.pulse)}
      textSize="text-[11px]"
      pulseDuration={1.4}
      glow={false}
    />
  );
};

export default OrderStatusBadge;
