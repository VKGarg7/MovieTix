import React from "react";
import { getActionMeta } from "../../../lib/auditSummary";
import StatusPill from "../StatusPill";

const ActionBadge = ({ action }) => {
  const meta = getActionMeta(action);
  return <StatusPill variant="plain" label={meta.label} cls={meta.cls} />;
};

export default ActionBadge;
