import React from "react";
import GlassPanel from "./GlassPanel";

const TAG_LABELS = {
  moved: "🥹 Moved",
  thrilled: "😃 Thrilled",
  meh: "😐 Meh",
  haunted: "😨 Haunted",
  inspired: "✨ Inspired",
  laughed: "😂 Laughed",
  bored: "🥱 Bored",
};

const EmotionalBreakdown = ({ breakdown, total }) => {
  if (!breakdown || breakdown.length === 0 || total === 0) return null;

  return (
    <GlassPanel hover={false} className="p-6 mb-8 max-w-2xl">
      <p className="text-sm font-medium mb-4">How viewers felt</p>
      <div className="flex flex-col gap-2.5">
        {breakdown.map(({ tag, count }) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={tag} className="flex items-center gap-3">
              <span className="text-sm w-24 shrink-0">{TAG_LABELS[tag] || tag}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-nebula-violet rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-10 text-right shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-4">{total} moviegoer{total === 1 ? "" : "s"} shared how it felt</p>
    </GlassPanel>
  );
};

export default EmotionalBreakdown;
