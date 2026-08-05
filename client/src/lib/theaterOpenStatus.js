const AVERAGE_RUNTIME_BUFFER_MS = 3 * 60 * 60 * 1000; 
const UPCOMING_WINDOW_MS = 2 * 60 * 60 * 1000;

export const deriveOpenStatus = (shows = []) => {
  const now = Date.now();

  const nextShow = shows
    .map((s) => ({ ...s, ts: new Date(s.showDateTime).getTime() }))
    .filter((s) => Number.isFinite(s.ts))
    .sort((a, b) => a.ts - b.ts)
    .find((s) => s.ts + AVERAGE_RUNTIME_BUFFER_MS > now);

  if (!nextShow) return { isOpen: false, nextShow: null };

  const isCurrentlyScreening = nextShow.ts <= now && nextShow.ts + AVERAGE_RUNTIME_BUFFER_MS > now;
  const isStartingSoon = nextShow.ts > now && nextShow.ts - now <= UPCOMING_WINDOW_MS;

  return { isOpen: isCurrentlyScreening || isStartingSoon, nextShow };
};
