import React from "react";
import { TriangleIcon } from "lucide-react";

const AdjustmentBadge = ({ percent }) => {
  const isUp = percent >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${isUp ? "text-nebula-amber" : "text-nebula-cyan"}`}>
      <TriangleIcon className={`w-2.5 h-2.5 ${isUp ? "" : "rotate-180"}`} fill="currentColor" strokeWidth={0} />
      {isUp ? "+" : ""}{percent}%
    </span>
  );
};

export default AdjustmentBadge;
