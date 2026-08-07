const HANDOFF_KEY = "movie-match-handoff-names";

export const setMatchHandoff = (status) => sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(status));

export const consumeMatchHandoffNames = () => {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    const names = JSON.parse(raw).participantNames || [];
    return names.length ? names : null;
  } catch {
    return null;
  }
};
