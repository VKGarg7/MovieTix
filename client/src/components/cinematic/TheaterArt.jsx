import React from "react";
import { Building2Icon } from "lucide-react";

const TheaterArt = ({ palette, className = "" }) => {
  const [a, b] = palette;
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${a}33, #0B0B10 70%)` }} />
      <div
        className="absolute -top-1/3 -left-1/4 w-2/3 h-2/3 rounded-full blur-3xl opacity-50"
        style={{ background: a }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 w-2/3 h-2/3 rounded-full blur-3xl opacity-40"
        style={{ background: b }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Building2Icon className="w-14 h-14 text-white/25" strokeWidth={1.2} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
    </div>
  );
};

export default TheaterArt;
