import { getGenreNames } from './movieGenres.js';

const BOOKING_SIGNAL_WEIGHT = 3;
const FOLLOW_SIGNAL_WEIGHT = 1;
const EMOTIONAL_TAG_SIGNAL_WEIGHT = 1;
const MAX_RECOMMENDATIONS = 5;


export const scoreCandidates = (candidates, signals, { userTagWeight, candidateTagDistribution } = {}) => {
    const genreWeight = new Map(); 
    const genreSource = new Map(); 

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

        if (userTagWeight && candidateTagDistribution) {
            const candidateTags = candidateTagDistribution.get(candidate._id) || candidateTagDistribution.get(candidate._id?.toString());
            if (candidateTags) {
                for (const [tag, count] of candidateTags) {
                    const userWeight = userTagWeight.get(tag) || 0;
                    if (userWeight > 0) {
                        score += EMOTIONAL_TAG_SIGNAL_WEIGHT * userWeight * count;
                    }
                }
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

    const top = scored.slice(0, MAX_RECOMMENDATIONS);
    const maxScore = Math.max(...top.map((r) => r.score), 0);

    const withMatch = top.map((r) => ({
        ...r,
        matchPercent: maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 60,
    }));

    return { recommendations: withMatch };
};

export { BOOKING_SIGNAL_WEIGHT, FOLLOW_SIGNAL_WEIGHT, EMOTIONAL_TAG_SIGNAL_WEIGHT, MAX_RECOMMENDATIONS };
