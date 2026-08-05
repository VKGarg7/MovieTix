import React from "react";
import { FilmIcon, Building2Icon, MonitorPlayIcon, ClapperboardIcon } from "lucide-react";

const ENTITY_ICON = {
  Show: ClapperboardIcon,
  Theater: Building2Icon,
  Screen: MonitorPlayIcon,
  Movie: FilmIcon,
};

const entityName = (entry) => {
  const after = entry.diff?.after || {};
  const before = entry.diff?.before || {};
  return after.title || after.name || before.title || before.name || null;
};

const EntityCell = ({ entry }) => {
  const Icon = ENTITY_ICON[entry.entityType] || ClapperboardIcon;
  const name = entityName(entry);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-200 truncate">{name || entry.entityType}</p>
        <p className="text-[10px] text-gray-500">{entry.entityType} · #{entry.entityId?.slice(-6)}</p>
      </div>
    </div>
  );
};

export default EntityCell;
