import React from "react";
import { CheckCircle2Icon, RotateCcwIcon, XCircleIcon, ClockIcon } from "lucide-react";
import StatusPill from "../StatusPill";

const STATUS_META = {
  paid: { label: "Paid", icon: CheckCircle2Icon, tone: "cyan" },
  refunded: { label: "Refunded", icon: RotateCcwIcon, tone: "amber" },
  failed: { label: "Failed", icon: XCircleIcon, tone: "primary" },
  pending: { label: "Pending", icon: ClockIcon, tone: "neutralLight" },
};

const PaymentStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <StatusPill variant="icon" label={meta.label} tone={meta.tone} icon={meta.icon} />;
};

export default PaymentStatusPill;
