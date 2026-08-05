import React from "react";

const ActivityTableHeader = () => (
  <div className="grid grid-cols-[110px_170px_90px_180px_1fr_80px_90px] items-center gap-3 px-3.5 pb-1.5 text-[10px] uppercase tracking-wide text-gray-500">
    <span>Time</span>
    <span>Actor</span>
    <span>Action</span>
    <span>Entity</span>
    <span>Summary</span>
    <span>Status</span>
    <span className="text-right">Details</span>
  </div>
);

export default ActivityTableHeader;
