export const bandForRowIndex = (rowIndex, totalRows) => {
  if (totalRows <= 3) return "single";
  const third = totalRows / 3;
  if (rowIndex < third) return "front";
  if (rowIndex < third * 2) return "middle";
  return "back";
};

export const resolveViewFromSeatUrl = (viewFromSeat, band) => {
  if (!viewFromSeat) return null;
  if (band !== "single" && viewFromSeat[band]) return viewFromSeat[band];
  return viewFromSeat.front || viewFromSeat.middle || viewFromSeat.back || null;
};
