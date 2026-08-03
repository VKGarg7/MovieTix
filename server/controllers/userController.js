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

// API controller function to get user bookings
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

    res.json({ success: true, bookings, pageInfo: buildPageMeta(page, limit, total) });
});


// API controller function to update favorite movie in clerk user metadata
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
    const favorites = user.privateMetadata.favorites;

    //getting movies from database
    const movies = await Movie.find({ _id: { $in: favorites }});

    res.json({ success: true, movies });
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


export const getReferralInfo = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    let referralCode = (await User.findById(userId).select('referralCode'))?.referralCode;
    if (!referralCode) {
        referralCode = await assignReferralCode(userId);
    }

    const referralCount = await Referral.countDocuments({ referrer: userId, rewardGranted: true });

    res.json({ success: true, referralCode, referralCount });
});
