export const getGenreNames = (movie) => (movie?.genres || []).map(g => g.name).filter(Boolean);
