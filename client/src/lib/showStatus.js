export const getShowStatus = (show, now) => {
  if (show.isCancelled) return "cancelled";
  const start = new Date(show.showDateTime).getTime();
  const end = start + (show.movie?.runtime ? show.movie.runtime * 60000 : 3 * 60 * 60000);
  if (now > end) return "completed";
  const capacity = show.screen?.totalCapacity || 0;
  const occupied = Object.keys(show.occupiedSeats || {}).length;
  if (now >= start && now <= end) return "running";
  if (capacity > 0 && occupied >= capacity) return "full";
  return "upcoming";
};
