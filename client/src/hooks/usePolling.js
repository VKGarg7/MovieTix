import { useEffect } from "react";

const usePolling = (pollFn, intervalMs, { enabled = true, deps = [] } = {}) => {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const isCancelled = () => cancelled;

    pollFn(isCancelled);
    const id = setInterval(() => pollFn(isCancelled), intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
};

export default usePolling;
