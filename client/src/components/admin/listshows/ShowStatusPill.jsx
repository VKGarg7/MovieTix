import React from "react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  running: { label: "Running", tone: "cyan", pulse: true },
  upcoming: { label: "Upcoming", tone: "violet" },
  full: { label: "House Full", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "primary" },
  completed: { label: "Completed", tone: "neutral" },
};

const ShowStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.upcoming;
  return <StatusPill label={meta.label} tone={meta.tone} pulse={Boolean(meta.pulse)} />;
};

export default ShowStatusPill;
