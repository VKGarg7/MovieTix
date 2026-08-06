import React from "react";
import { StarIcon } from "lucide-react";

const SIZES = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const RatingStars = ({ value = 0, onChange, size = "md", className = "" }) => {
  const interactive = typeof onChange === "function";
  const starClass = SIZES[size] || SIZES.md;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const star_ = (
          <StarIcon
            className={`${starClass} transition-colors ${filled ? "text-primary fill-primary" : "text-gray-600"}`}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            className="cursor-pointer"
          >
            {star_}
          </button>
        ) : (
          <span key={star}>{star_}</span>
        );
      })}
    </div>
  );
};

export default RatingStars;
