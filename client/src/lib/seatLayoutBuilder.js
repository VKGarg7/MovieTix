export const SEAT_TYPE_META = {
  regular: { label: "Regular", color: "#3FD8E0", emoji: "🟦" },
  premium: { label: "Premium", color: "#6D5CFF", emoji: "🟪" },
  recliner: { label: "VIP", color: "#FFB86B", emoji: "🟨" },
  accessible: { label: "Wheelchair", color: "#9CA3AF", emoji: "⬜" },
};

export const SEAT_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "premium", label: "Premium" },
  { value: "recliner", label: "VIP" },
  { value: "accessible", label: "Wheelchair" },
];

export const nextRowLabel = (rows) => {
  const used = new Set(rows.map((r) => r.label));
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!used.has(letter)) return letter;
  }
  return "";
};

export const emptyRow = (rows = []) => ({ label: nextRowLabel(rows), seatCount: 8, seatType: "regular" });

export const summarizeRows = (rows) => {
  const summary = { total: 0, regular: 0, premium: 0, recliner: 0, accessible: 0 };
  rows.forEach((r) => {
    const count = Number(r.seatCount) || 0;
    summary.total += count;
    if (summary[r.seatType] !== undefined) summary[r.seatType] += count;
  });
  return summary;
};
