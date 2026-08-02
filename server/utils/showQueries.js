import Show from '../models/Show.js';

// A show is only "bookable" while showDateTime hasn't passed, so this must be
// evaluated fresh per call rather than reusing a cached filter object.
export const bookableShowFilter = () => ({ showDateTime: { $gte: new Date() }, isCancelled: { $ne: true } });

export const getBookableMovieIds = () => Show.distinct('movie', bookableShowFilter());
