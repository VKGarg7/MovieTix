// v1: weighted genre-overlap score computed on read. Kept isolated from the
// controller so a future collaborative-filtering/embedding model can replace
// scoreCandidates() without touching the signal-gathering or API contract.

import { getGenreNames } from './movieGenres.js';

const BOOKING_SIGNAL_WEIGHT = 3;
const FOLLOW_SIGNAL_WEIGHT = 1;
const MAX_RECOMMENDATIONS = 5;

// signals: [{ movie, weight }] — one entry per booked/followed movie the user has a
// relationship with, already deduplicated by the caller.
export const scoreCandidates = (candidates, signals) => {
    const genreWeight = new Map(); // genreName -> accumulated weight
    const genreSource = new Map(); // genreName -> title of the highest-weight contributing movie

    for (const { movie, weight } of signals) {
        for (const genreName of getGenreNames(movie)) {
            const current = genreWeight.get(genreName) || 0;
            if (weight > current || !genreSource.has(genreName)) {
                genreSource.set(genreName, movie.title);
            }
            genreWeight.set(genreName, current + weight);
        }
    }

    const scored = candidates.map((candidate) => {
        const candidateGenres = getGenreNames(candidate);
        let score = 0;
        let bestGenre = null;
        let bestGenreWeight = 0;

        for (const genreName of candidateGenres) {
            const weight = genreWeight.get(genreName) || 0;
            score += weight;
            if (weight > bestGenreWeight) {
                bestGenreWeight = weight;
                bestGenre = genreName;
            }
        }

        const reason = bestGenre
            ? `Because you liked ${genreSource.get(bestGenre)} (${bestGenre})`
            : 'Top rated on our platform';

        return { movie: candidate, score, reason };
    });

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.movie.vote_average || 0) - (a.movie.vote_average || 0);
    });

    return { recommendations: scored.slice(0, MAX_RECOMMENDATIONS) };
};

export { BOOKING_SIGNAL_WEIGHT, FOLLOW_SIGNAL_WEIGHT, MAX_RECOMMENDATIONS };
