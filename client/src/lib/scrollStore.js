export const scrollState = {
  y: 0,
  maxY: 1,
  progress: 0,
  velocity: 0, 
};

let lastY = 0;
let lastT = performance.now();

const updateMaxY = () => {
  scrollState.maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
};

const onScroll = () => {
  const now = performance.now();
  const dt = Math.max(1, now - lastT);
  const y = window.scrollY;
  const dy = y - lastY;
  scrollState.velocity += ((dy / dt) * 16 - scrollState.velocity) * 0.3; // smoothed px/frame-ish
  lastY = y;
  lastT = now;

  scrollState.y = y;
  scrollState.progress = Math.min(1, Math.max(0, y / scrollState.maxY));
};

export const initScrollStore = () => {
  updateMaxY();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateMaxY);
  const observer = new MutationObserver(updateMaxY);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", updateMaxY);
    observer.disconnect();
  };
};
