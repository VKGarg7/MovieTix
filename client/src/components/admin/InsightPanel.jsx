import React from "react";

const InsightPanel = ({ icon: Icon, title, className = "rounded-xl border border-nebula-violet/25 bg-nebula-violet/[0.05] p-3 flex flex-wrap items-start gap-2", children }) => (
  <div className={className}>
    {Icon && <Icon className="w-4 h-4 text-nebula-violet shrink-0 mt-1" />}
    <div className="flex-1 min-w-0">{title ? <p className="font-medium text-nebula-violet mb-0.5 text-xs">{title}</p> : null}{children}</div>
  </div>
);

export default InsightPanel;