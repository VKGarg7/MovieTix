import React from "react";

const DetailTile = ({ title, icon: Icon, className = "rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5", titleClassName = "flex items-center gap-1.5 text-[11px] text-gray-500", children }) => (
  <div className={className}>
    <p className={titleClassName}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {title}
    </p>
    {children}
  </div>
);

export default DetailTile;