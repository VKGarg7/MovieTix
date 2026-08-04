import { useEffect } from "react";

const useFetchOnUser = (user, fetchFn, extraDeps = []) => {
  useEffect(() => {
    if (!user) return;
    fetchFn();
    // fetchFn is intentionally excluded — callers close over state setters
    // that aren't referentially stable, and re-running only on `user` (plus
    // any caller-supplied extra deps) matches the pre-extraction behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ...extraDeps]);
};

export default useFetchOnUser;
