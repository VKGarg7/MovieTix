import React from "react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  active: { label: "Active", tone: "cyan", pulse: true },
  scheduled: { label: "Scheduled", tone: "violet" },
  expired: { label: "Expired", tone: "neutral" },
  paused: { label: "Paused", tone: "amber" },
};

const RuleStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.paused;
  return <StatusPill label={meta.label} tone={meta.tone} pulse={Boolean(meta.pulse)} />;
};

export default RuleStatusPill;
