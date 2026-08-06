import Booking from '../models/Booking.js';
import Follow from '../models/Follow.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import EmotionalPulse from '../models/EmotionalPulse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scoreCandidates, BOOKING_SIGNAL_WEIGHT, FOLLOW_SIGNAL_WEIGHT } from '../utils/recommendationEngine.js';
import { getBookableMovieIds } from '../utils/showQueries.js';

export const getRecommendations = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    const bookedShowIds = await Booking.distinct('show', { user: userId, isPaid: true });
    const bookedMovieIds = bookedShowIds.length > 0
        ? await Show.distinct('movie', { _id: { $in: bookedShowIds } })
        : [];

    const followedMovieIds = await Follow.distinct('movie', { user: userId });

    const bookableMovieIds = await getBookableMovieIds();

    const candidateIds = bookableMovieIds.filter(id => !bookedMovieIds.includes(id));

    const [bookedMovies, followedMovies, candidates] = await Promise.all([
        Movie.find({ _id: { $in: bookedMovieIds } }),
        Movie.find({ _id: { $in: followedMovieIds.filter(id => !bookedMovieIds.includes(id)) } }),
        Movie.find({ _id: { $in: candidateIds } }),
    ]);

    if (candidates.length === 0) {
        return res.json({ success: true, recommendations: [] });
    }

    const signals = [
        ...bookedMovies.map(movie => ({ movie, weight: BOOKING_SIGNAL_WEIGHT })),
        ...followedMovies.map(movie => ({ movie, weight: FOLLOW_SIGNAL_WEIGHT })),
    ];

    const [myPulses, candidateTagCounts] = await Promise.all([
        EmotionalPulse.find({ userId }, { tag: 1 }),
        candidateIds.length > 0
            ? EmotionalPulse.aggregate([
                { $match: { movieId: { $in: candidateIds } } },
                { $group: { _id: { movieId: '$movieId', tag: '$tag' }, count: { $sum: 1 } } },
            ])
            : [],
    ]);

    const userTagWeight = new Map();
    for (const pulse of myPulses) {
        userTagWeight.set(pulse.tag, (userTagWeight.get(pulse.tag) || 0) + 1);
    }

    const candidateTagDistribution = new Map();
    for (const { _id, count } of candidateTagCounts) {
        if (!candidateTagDistribution.has(_id.movieId)) {
            candidateTagDistribution.set(_id.movieId, new Map());
        }
        candidateTagDistribution.get(_id.movieId).set(_id.tag, count);
    }

    const { recommendations } = scoreCandidates(candidates, signals, { userTagWeight, candidateTagDistribution });

    res.json({
        success: true,
        recommendations: recommendations.map(({ movie, reason, matchPercent }) => ({ movie, reason, matchPercent })),
    });
});
