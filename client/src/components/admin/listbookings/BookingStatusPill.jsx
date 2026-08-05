import React from "react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  confirmed: { label: "Confirmed", tone: "cyan", pulse: true },
  "checked-in": { label: "Checked In", tone: "violet" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "primary" },
  refunded: { label: "Refunded", tone: "amber" },
  pending: { label: "Pending", tone: "neutralLight" },
};

const BookingStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <StatusPill label={meta.label} tone={meta.tone} pulse={Boolean(meta.pulse)} />;
};

export default BookingStatusPill;
