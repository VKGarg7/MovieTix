import React from "react";

const formatRelative = (date, now) => {
  const diffMs = now - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const RelativeTime = ({ value, now = Date.now() }) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = date.toLocaleDateString([], { day: "numeric", month: "short" });

  return (
    <div>
      <p className="text-xs text-gray-200">{time} <span className="text-gray-500">· {day}</span></p>
      <p className="text-[10px] text-gray-500">{formatRelative(date, now)}</p>
    </div>
  );
};

export default RelativeTime;
