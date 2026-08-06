import React, { useState } from "react";
import RatingStars from "./RatingStars";

const ReviewCard = ({ review, spoilerSafeMode, hasWatched }) => {
  const [revealed, setRevealed] = useState(false);
  const isCollapsed = review.spoiler && spoilerSafeMode && !hasWatched && !revealed;

  return (
    <div className="glass-panel glass-panel-hover p-5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-nebula-violet/60 flex items-center justify-center text-xs font-semibold shrink-0">
          {(review.user?.name || "A").charAt(0).toUpperCase()}
        </div>
        <p className="font-medium text-sm">{review.user?.name || "Anonymous"}</p>
        <RatingStars value={review.rating} size="sm" />
        {review.spoiler && (
          <span className="text-[10px] font-semibold text-nebula-amber border border-nebula-amber/50 rounded px-1.5 py-0.5">
            SPOILER
          </span>
        )}
      </div>
      {review.text && (
        isCollapsed ? (
          <button
            onClick={() => {
              if (window.confirm("This review contains spoilers. Reveal it anyway?")) {
                setRevealed(true);
              }
            }}
            className="text-gray-400 text-sm mt-3 italic cursor-pointer hover:text-gray-300 transition-colors"
          >
            Spoiler hidden — click to reveal
          </button>
        ) : (
          <p className="text-gray-400 text-sm mt-3 font-light leading-relaxed">{review.text}</p>
        )
      )}
    </div>
  );
};

export default ReviewCard;
