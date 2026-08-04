import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { isMysteryRevealed } from '../utils/mysteryMovie.js';

export const userHasWatchedMovie = async (userId, movieId) => {
    const shows = await Show.find(
        { movie: movieId, showDateTime: { $lt: new Date() } },
        { isMysteryMovie: 1, mysteryRevealAt: 1 }
    );
    const revealedShowIds = shows
        .filter(show => isMysteryRevealed(show, { isPaid: true }))
        .map(show => show._id.toString());
    if (revealedShowIds.length === 0) return false;

    const booking = await Booking.findOne({
        user: userId,
        isPaid: true,
        show: { $in: revealedShowIds },
    });

    return Boolean(booking);
};

export const upsertReview = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { movieId, rating, text, spoiler } = req.body;

    if (!movieId || typeof movieId !== 'string') {
        throw new AppError('movieId is required', 400, 'INVALID_INPUT');
    }
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new AppError('rating must be an integer between 1 and 5', 400, 'INVALID_INPUT');
    }

    const eligible = await userHasWatchedMovie(userId, movieId);
    if (!eligible) {
        throw new AppError(
            'You can only review movies you have a completed, paid booking for.',
            403,
            'NOT_ELIGIBLE_TO_REVIEW'
        );
    }

    const review = await Review.findOneAndUpdate(
        { user: userId, movie: movieId },
        { rating: parsedRating, text: typeof text === 'string' ? text : '', spoiler: Boolean(spoiler) },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, review });
});

export const getMovieReviews = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    const [reviews, [stats]] = await Promise.all([
        Review.find({ movie: movieId }).populate('user', 'name image').sort({ updatedAt: -1 }),
        Review.aggregate([
            { $match: { movie: movieId } },
            { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
        ]),
    ]);

    res.json({
        success: true,
        reviews,
        averageRating: stats?.averageRating ?? null,
        reviewCount: stats?.reviewCount ?? 0,
    });
});

export const getMyReviewForMovie = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { movieId } = req.params;

    const review = await Review.findOne({ user: userId, movie: movieId });
    res.json({ success: true, review });
});

export const getMovieWatchedStatus = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { movieId } = req.params;

    const watched = await userHasWatchedMovie(userId, movieId);
    res.json({ success: true, watched });
});
