export const AMENITIES = [
  { key: "dolby", label: "Dolby Atmos", icon: "Volume2Icon" },
  { key: "imax", label: "IMAX", icon: "MonitorPlayIcon" },
  { key: "foodCourt", label: "Food Court", icon: "PopcornIcon" },
  { key: "parking", label: "Parking", icon: "CarIcon" },
  { key: "recliner", label: "Recliners", icon: "SofaIcon" },
];

const GRADIENT_PALETTES = [
  ["#6D5CFF", "#F84565"],
  ["#F84565", "#FFB86B"],
  ["#3FD8E0", "#6D5CFF"],
  ["#FFB86B", "#3FD8E0"],
  ["#6D5CFF", "#3FD8E0"],
];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getTheaterPresentation = (theater) => {
  const seed = hashString(theater?._id || theater?.name || "theater");

  const palette = GRADIENT_PALETTES[seed % GRADIENT_PALETTES.length];
  const rating = (4 + ((seed % 10) / 10)).toFixed(1); 
  const distanceKm = (0.8 + ((seed % 47) / 10)).toFixed(1); 
  const amenityCount = 3 + (seed % 3); 
  const amenities = AMENITIES.filter((_, i) => (seed >> i) % 2 === 0 || i < 2).slice(0, amenityCount);

  return {
    palette,
    rating,
    distanceKm,
    amenities: amenities.length ? amenities : AMENITIES.slice(0, 3),
    isPlaceholder: true,
  };
};
