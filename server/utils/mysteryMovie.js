export const isMysteryRevealed = (show, { isPaid = false } = {}) => {
    if (!show?.isMysteryMovie) return true;
    if (show.mysteryRevealAt === 'onBooking') return isPaid;
    return false;
};

const RATING_BANDS = [
    { min: 8, label: '8+ rated' },
    { min: 7, label: '7+ rated' },
    { min: 6, label: '6+ rated' },
    { min: 5, label: '5+ rated' },
    { min: 0, label: 'Under 5 rated' },
];

export const ratingBandFor = (voteAverage) => {
    if (typeof voteAverage !== 'number' || Number.isNaN(voteAverage)) return 'Unrated';
    return RATING_BANDS.find(band => voteAverage >= band.min).label;
};

export const maskMovieForMystery = (movie) => {
    if (!movie) return movie;
    return {
        _id: movie._id,
        isMysteryMovie: true,
        genres: movie.genres,
        runtime: movie.runtime,
        ratingBand: ratingBandFor(movie.vote_average),
    };
};
