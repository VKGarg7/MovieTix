import Booking from "../models/Booking.js";
import PointsTransaction from "../models/PointsTransaction.js";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { clerkClient } from "@clerk/express";
import Movie from "../models/Movie.js";
import Follow from "../models/Follow.js";
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { getPointsBalance, POINTS_CONFIG } from '../utils/loyaltyPoints.js';
import { assignReferralCode } from '../utils/referrals.js';
import { isMysteryRevealed, maskMovieForMystery } from '../utils/mysteryMovie.js';
import { SEAT_ID_PATTERN } from '../utils/seatId.js';

const CANCELLED_STATUSES = ['cancelled', 'pending-cancellation'];

const categoryMatch = (category) => {
    if (category === 'Cancelled') {
        return { status: { $in: CANCELLED_STATUSES } };
    }
    if (category === 'Upcoming') {
        return {
            status: { $nin: CANCELLED_STATUSES },
            $or: [{ isPaid: false }, { 'show.showDateTime': { $gt: new Date() } }],
        };
    }
    if (category === 'Completed') {
        return {
            status: { $nin: CANCELLED_STATUSES },
            isPaid: true,
            'show.showDateTime': { $lte: new Date() },
        };
    }
    return {};
};

export const getUserBookings = asyncHandler(async (req, res) => {
    const user = req.auth().userId;
    const { category } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const basePipeline = [
        { $match: { user } },
        {
            $lookup: {
                from: 'shows',
                let: { showId: '$show' },
                pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$showId'] } } }],
                as: 'show',
            },
        },
        { $unwind: { path: '$show', preserveNullAndEmptyArrays: true } },
        { $match: categoryMatch(category) },
    ];

    const [bookings, [countResult]] = await Promise.all([
        Booking.aggregate([
            ...basePipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'movies',
                    let: { movieId: '$show.movie' },
                    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$movieId'] } } }],
                    as: 'show.movie',
                },
            },
            { $unwind: { path: '$show.movie', preserveNullAndEmptyArrays: true } },
        ]),
        Booking.aggregate([...basePipeline, { $count: 'total' }]),
    ]);

    const total = countResult?.total || 0;

    const bookingsWithMysteryMasking = bookings.map(booking => {
        if (!booking.show?.movie || !isMysteryRevealed(booking.show, { isPaid: booking.isPaid })) {
            return booking.show?.movie
                ? { ...booking, show: { ...booking.show, movie: maskMovieForMystery(booking.show.movie) } }
                : booking;
        }
        return booking;
    });

    res.json({ success: true, bookings: bookingsWithMysteryMasking, pageInfo: buildPageMeta(page, limit, total) });
});


export const updateFavorite = asyncHandler(async (req, res) => {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
        user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
        user.privateMetadata.favorites.push(movieId);
    } else {
        user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId);
    }

    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            favorites: user.privateMetadata.favorites,
        },
    });


    res.json({ success: true, message: "Favorite movies updated" });
});


export const getFavorites = asyncHandler(async (req, res) => {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites || [];

    const movies = await Movie.find({ _id: { $in: favorites }});

    const movieById = new Map(movies.map(movie => [movie._id.toString(), movie]));
    const orderedMovies = favorites
        .map(id => movieById.get(id))
        .filter(Boolean);

    res.json({ success: true, movies: orderedMovies });
});


export const followMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    if (!movieId || typeof movieId !== 'string') {
        throw new AppError('movieId is required', 400, 'INVALID_INPUT');
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
    }

    await Follow.updateOne(
        { user: userId, movie: movieId },
        { user: userId, movie: movieId },
        { upsert: true }
    );

    res.json({ success: true, following: true });
});


export const unfollowMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const userId = req.auth().userId;

    await Follow.deleteOne({ user: userId, movie: movieId });

    res.json({ success: true, following: false });
});


export const getFollowedMovies = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    const follows = await Follow.find({ user: userId });
    const movies = await Movie.find({ _id: { $in: follows.map(f => f.movie) } });

    res.json({ success: true, movies });
});


export const getFollowStatus = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { movieId } = req.params;

    const follow = await Follow.findOne({ user: userId, movie: movieId });

    res.json({ success: true, following: Boolean(follow) });
});


export const getPointsSummary = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const balance = await getPointsBalance(userId);

    res.json({ success: true, balance, config: POINTS_CONFIG });
});


export const getPointsHistory = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { page, limit, skip } = parsePagination(req.query);

    const [transactions, total] = await Promise.all([
        PointsTransaction.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        PointsTransaction.countDocuments({ user: userId }),
    ]);

    res.json({ success: true, transactions, pageInfo: buildPageMeta(page, limit, total) });
});


const MIN_BOOKINGS_FOR_WRAPPED = 2;

export const getWrapped = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    const paidMatch = { user: userId, isPaid: true, status: { $nin: CANCELLED_STATUSES } };

    const joinShowAndMovie = [
        {
            $lookup: {
                from: 'shows',
                let: { showId: '$show' },
                pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$showId'] } } }],
                as: 'show',
            },
        },
        { $unwind: '$show' },
        { $lookup: { from: 'movies', localField: 'show.movie', foreignField: '_id', as: 'movie' } },
        { $unwind: '$movie' },
        { $lookup: { from: 'screens', localField: 'show.screen', foreignField: '_id', as: 'screen' } },
        { $unwind: '$screen' },
        { $lookup: { from: 'theaters', localField: 'screen.theater', foreignField: '_id', as: 'theater' } },
        { $unwind: '$theater' },
    ];

    const [bookings, totalSpentAgg, userCount, spentBelowMeCount] = await Promise.all([
        Booking.aggregate([{ $match: paidMatch }, ...joinShowAndMovie]),
        Booking.aggregate([{ $match: paidMatch }, { $group: { _id: '$user', total: { $sum: '$amount' } } }]),
        Booking.aggregate([{ $match: { isPaid: true, status: { $nin: CANCELLED_STATUSES } } }, { $group: { _id: '$user' } }, { $count: 'count' }]),
        (async () => {
            const [{ total: mySpend } = { total: 0 }] = await Booking.aggregate([
                { $match: paidMatch },
                { $group: { _id: '$user', total: { $sum: '$amount' } } },
            ]);
            const perUserSpend = await Booking.aggregate([
                { $match: { isPaid: true, status: { $nin: CANCELLED_STATUSES } } },
                { $group: { _id: '$user', total: { $sum: '$amount' } } },
                { $match: { total: { $lte: mySpend } } },
                { $count: 'count' },
            ]);
            return perUserSpend[0]?.count || 0;
        })(),
    ]);

    const totalBookings = bookings.length;

    if (totalBookings < MIN_BOOKINGS_FOR_WRAPPED) {
        return res.json({ success: true, hasEnoughHistory: false, totalBookings });
    }

    const totalSpent = totalSpentAgg[0]?.total || 0;
    const totalPopulation = userCount[0]?.count || 1;
    const spendPercentile = Math.round((spentBelowMeCount / totalPopulation) * 100);

    const genreCounts = new Map();
    const theaterCounts = new Map();
    const rowCounts = new Map();
    let longestMovie = null;
    let totalSeats = 0;

    for (const booking of bookings) {
        for (const genre of booking.movie.genres || []) {
            genreCounts.set(genre.name, (genreCounts.get(genre.name) || 0) + 1);
        }

        const theaterKey = booking.theater._id.toString();
        const theaterEntry = theaterCounts.get(theaterKey) || { name: booking.theater.name, city: booking.theater.city, count: 0 };
        theaterEntry.count += 1;
        theaterCounts.set(theaterKey, theaterEntry);

        for (const seat of booking.bookedSeats || []) {
            const match = SEAT_ID_PATTERN.exec(seat);
            if (match) {
                const row = match[1];
                rowCounts.set(row, (rowCounts.get(row) || 0) + 1);
            }
            totalSeats += 1;
        }

        if (!longestMovie || (booking.movie.runtime || 0) > longestMovie.runtime) {
            longestMovie = { title: booking.movie.title, runtime: booking.movie.runtime || 0, poster_path: booking.movie.poster_path };
        }
    }

    const topByCount = (counts) => [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

    const favoriteGenre = topByCount(genreCounts)?.[0] || null;
    const favoriteRow = topByCount(rowCounts)?.[0] || null;
    const topTheaterEntry = [...theaterCounts.values()].sort((a, b) => b.count - a.count)[0] || null;

    res.json({
        success: true,
        hasEnoughHistory: true,
        totalBookings,
        totalSeats,
        totalSpent,
        favoriteGenre,
        favoriteRow,
        mostVisitedTheater: topTheaterEntry ? { name: topTheaterEntry.name, city: topTheaterEntry.city, visits: topTheaterEntry.count } : null,
        longestMovie,
        spendPercentile,
    });
});


export const getReferralInfo = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    let referralCode = (await User.findById(userId).select('referralCode'))?.referralCode;
    if (!referralCode) {
        referralCode = await assignReferralCode(userId);
    }

    const referralCount = await Referral.countDocuments({ referrer: userId, rewardGranted: true });

    res.json({ success: true, referralCode, referralCount });
});
