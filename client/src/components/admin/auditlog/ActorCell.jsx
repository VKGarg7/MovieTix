import React from "react";
import { getActorInitials } from "../../../lib/auditSummary";

const ROLE_LABEL = { superAdmin: "Super Admin", theaterAdmin: "Theater Admin" };

const ActorCell = ({ entry }) => (
  <div className="flex items-center gap-2 min-w-0">
    {entry.actorImage ? (
      <img src={entry.actorImage} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
    ) : (
      <span className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-nebula-violet/30 border border-white/10 text-[11px] font-semibold shrink-0">
        {getActorInitials(entry)}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium truncate">{entry.actorName || "Unknown user"}</p>
      <div className="flex items-center gap-1">
        <span className="px-1.5 py-0 rounded-full text-[9px] bg-white/5 border border-white/10 text-gray-400">
          {ROLE_LABEL[entry.actorRole] || entry.actorRole}
        </span>
        <span className="text-[9px] text-gray-600 truncate">#{entry.actorId?.slice(-6)}</span>
      </div>
    </div>
  </div>
);

export default ActorCell;
