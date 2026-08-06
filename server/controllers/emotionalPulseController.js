import EmotionalPulse, { EMOTIONAL_TAGS } from '../models/EmotionalPulse.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { loadOwnedBooking } from '../utils/bookingOwnership.js';
import Show from '../models/Show.js';

const assertBookingIsTaggable = async (booking) => {
    if (!booking.isPaid || booking.status === 'cancelled' || booking.status === 'pending-cancellation') {
        throw new AppError('Only completed, paid bookings can be tagged', 400, 'BOOKING_NOT_TAGGABLE');
    }
    const show = await Show.findById(booking.show);
    if (!show || show.showDateTime.getTime() > Date.now()) {
        throw new AppError('This booking\'s showtime hasn\'t passed yet', 400, 'SHOWTIME_NOT_PASSED');
    }
    return show;
};

export const upsertEmotionalPulse = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { bookingId, tag } = req.body;

    if (!bookingId || typeof bookingId !== 'string') {
        throw new AppError('bookingId is required', 400, 'INVALID_INPUT');
    }
    if (!EMOTIONAL_TAGS.includes(tag)) {
        throw new AppError(`tag must be one of: ${EMOTIONAL_TAGS.join(', ')}`, 400, 'INVALID_INPUT');
    }

    const booking = await loadOwnedBooking(bookingId, userId);
    const show = await assertBookingIsTaggable(booking);

    const pulse = await EmotionalPulse.findOneAndUpdate(
        { bookingId: booking._id },
        { userId, movieId: show.movie, bookingId: booking._id, tag },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, pulse });
});

export const getMyPulseForBooking = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { bookingId } = req.params;

    const pulse = await EmotionalPulse.findOne({ bookingId, userId });
    res.json({ success: true, pulse });
});

export const getMovieEmotionalBreakdown = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    const breakdown = await EmotionalPulse.aggregate([
        { $match: { movieId } },
        { $group: { _id: '$tag', count: { $sum: 1 } } },
        { $project: { _id: 0, tag: '$_id', count: 1 } },
        { $sort: { count: -1 } },
    ]);

    const total = breakdown.reduce((sum, entry) => sum + entry.count, 0);

    res.json({ success: true, breakdown, total });
});
