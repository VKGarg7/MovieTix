export const MIN_REVIEWS_FOR_BADGE = 5;
export const DIVERGENCE_THRESHOLD = 1.5; 

export const computeDivergenceBadge = (voteAverage, averageRating, reviewCount) => {
    if (reviewCount < MIN_REVIEWS_FOR_BADGE || averageRating == null || typeof voteAverage !== 'number') {
        return null;
    }

    const scaledReviewAverage = Math.round(averageRating * 2 * 10) / 10;
    const delta = Math.round((scaledReviewAverage - voteAverage) * 10) / 10;

    if (delta >= DIVERGENCE_THRESHOLD) return 'underrated';
    if (delta <= -DIVERGENCE_THRESHOLD) return 'overhyped';
    return null;
};
