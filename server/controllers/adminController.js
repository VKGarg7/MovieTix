import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import AuditLog, { AUDIT_ENTITY_TYPES } from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { getScreenIdsForTheater, getShowIdsForTheater } from '../utils/theaterScope.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { csvRow } from '../utils/csv.js';

export const isAdmin = (req, res) => {
    res.json({ success: true, isAdmin: true, role: req.adminContext.role })
}

const DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT = 12;

export const getDashboardData = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const showFilter = { showDateTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, isCancelled: { $ne: true } };
    const bookingFilter = { isPaid: true };
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const todayBookingFilter = { isPaid: true, createdAt: { $gte: startOfToday } };

    if (role === 'theaterAdmin') {
        showFilter.screen = { $in: await getScreenIdsForTheater(theaterId) };
        const scopedShowIds = { $in: await getShowIdsForTheater(theaterId) };
        bookingFilter.show = scopedShowIds;
        todayBookingFilter.show = scopedShowIds;
    }

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const yesterdayBookingFilter = { ...todayBookingFilter, createdAt: { $gte: startOfYesterday, $lt: startOfToday } };

    const [[bookingStats], [todayBookingStats], [yesterdayBookingStats], activeShowsCount, activeShowsRaw, totalUser] = await Promise.all([
        Booking.aggregate([
            { $match: bookingFilter },
            { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
        ]),
        Booking.aggregate([
            { $match: todayBookingFilter },
            { $group: { _id: null, todayBookings: { $sum: 1 }, todayRevenue: { $sum: '$amount' } } },
        ]),
        Booking.aggregate([
            { $match: yesterdayBookingFilter },
            { $group: { _id: null, todayBookings: { $sum: 1 }, todayRevenue: { $sum: '$amount' } } },
        ]),
        Show.countDocuments(showFilter),
        Show.find(showFilter).sort({ showDateTime: 1 }).limit(DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT).populate('movie').populate('screen'),
        role === 'superAdmin' ? User.countDocuments() : Promise.resolve(null),
    ]);

    const activeShowIds = activeShowsRaw.map(s => s._id.toString());
    const perShowBookingStats = activeShowIds.length > 0
        ? await Booking.aggregate([
            { $match: { isPaid: true, show: { $in: activeShowIds } } },
            { $group: { _id: '$show', revenue: { $sum: '$amount' }, seatsSold: { $sum: { $size: '$bookedSeats' } } } },
        ])
        : [];
    const statsByShowId = new Map(perShowBookingStats.map(s => [s._id, s]));

    const activeShows = activeShowsRaw.map(show => {
        const stats = statsByShowId.get(show._id.toString());
        const occupiedCount = Object.keys(show.occupiedSeats || {}).length;
        const totalCapacity = show.screen?.totalCapacity || 0;
        return {
            ...show.toObject(),
            revenue: stats?.revenue || 0,
            seatsSold: stats?.seatsSold || 0,
            occupiedCount,
            totalCapacity,
            occupancyPct: totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 1000) / 10 : 0,
        };
    });

    res.json({
        success: true,
        dashboardData: {
            totalBookings: bookingStats?.totalBookings || 0,
            totalRevenue: bookingStats?.totalRevenue || 0,
            todayBookings: todayBookingStats?.todayBookings || 0,
            todayRevenue: todayBookingStats?.todayRevenue || 0,
            yesterdayBookings: yesterdayBookingStats?.todayBookings || 0,
            yesterdayRevenue: yesterdayBookingStats?.todayRevenue || 0,
            activeShowsCount,
            activeShows,
            totalUser,
        },
    });
});


const DEFAULT_ANALYTICS_RANGE_DAYS = 30;

const parseDateRange = (query) => {
    const now = new Date();
    let from = query.from ? new Date(query.from) : null;
    let to = query.to ? new Date(query.to) : null;

    if (query.from && Number.isNaN(from?.getTime())) {
        throw new AppError('Invalid "from" date', 400, 'INVALID_INPUT');
    }
    if (query.to && Number.isNaN(to?.getTime())) {
        throw new AppError('Invalid "to" date', 400, 'INVALID_INPUT');
    }

    if (!to) to = now;
    if (!from) {
        from = new Date(to);
        from.setDate(from.getDate() - DEFAULT_ANALYTICS_RANGE_DAYS);
    }

    from = new Date(new Date(from).setUTCHours(0, 0, 0, 0));
    to = new Date(new Date(to).setUTCHours(23, 59, 59, 999));

    if (from > to) {
        throw new AppError('"from" must be before "to"', 400, 'INVALID_INPUT');
    }

    return { from, to };
};

const resolveAnalyticsTheaterId = (adminContext, query) => {
    const { role, theaterId } = adminContext;
    if (role === 'theaterAdmin') return theaterId;
    if (query.theaterId && mongoose.Types.ObjectId.isValid(query.theaterId)) return query.theaterId;
    return null;
};

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { from, to } = parseDateRange(req.query);
    const scopedTheaterId = resolveAnalyticsTheaterId(req.adminContext, req.query);

    const showIds = scopedTheaterId ? await getShowIdsForTheater(scopedTheaterId) : null;

    const bookingMatch = {
        isPaid: true,
        createdAt: { $gte: from, $lte: to },
    };
    if (showIds) {
        bookingMatch.show = { $in: showIds };
    }

    const [revenueTrend, topMovies, topTheaters, genreDistribution, communityRevenue] = await Promise.all([
        Booking.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$amount' },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', revenue: 1, bookings: 1 } },
        ]),
        Booking.aggregate([
            { $match: bookingMatch },
            { $addFields: { showObjectId: { $toObjectId: '$show' } } },
            {
                $lookup: {
                    from: 'shows',
                    localField: 'showObjectId',
                    foreignField: '_id',
                    as: 'showDoc',
                },
            },
            { $unwind: '$showDoc' },
            {
                $group: {
                    _id: '$showDoc.movie',
                    revenue: { $sum: '$amount' },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'movies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movieDoc',
                },
            },
            { $unwind: '$movieDoc' },
            {
                $project: {
                    _id: 0,
                    movieId: '$_id',
                    title: '$movieDoc.title',
                    poster_path: '$movieDoc.poster_path',
                    revenue: 1,
                    bookings: 1,
                },
            },
        ]),
        scopedTheaterId ? Promise.resolve([]) : Booking.aggregate([
            { $match: bookingMatch },
            { $addFields: { showObjectId: { $toObjectId: '$show' } } },
            { $lookup: { from: 'shows', localField: 'showObjectId', foreignField: '_id', as: 'showDoc' } },
            { $unwind: '$showDoc' },
            { $lookup: { from: 'screens', localField: 'showDoc.screen', foreignField: '_id', as: 'screenDoc' } },
            { $unwind: '$screenDoc' },
            { $group: { _id: '$screenDoc.theater', revenue: { $sum: '$amount' }, bookings: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'theaters', localField: '_id', foreignField: '_id', as: 'theaterDoc' } },
            { $unwind: '$theaterDoc' },
            {
                $project: {
                    _id: 0,
                    theaterId: '$_id',
                    name: '$theaterDoc.name',
                    city: '$theaterDoc.city',
                    revenue: 1,
                    bookings: 1,
                },
            },
        ]),
        Booking.aggregate([
            { $match: bookingMatch },
            { $addFields: { showObjectId: { $toObjectId: '$show' } } },
            { $lookup: { from: 'shows', localField: 'showObjectId', foreignField: '_id', as: 'showDoc' } },
            { $unwind: '$showDoc' },
            { $lookup: { from: 'movies', localField: 'showDoc.movie', foreignField: '_id', as: 'movieDoc' } },
            { $unwind: '$movieDoc' },
            { $unwind: '$movieDoc.genres' },
            { $group: { _id: '$movieDoc.genres.name', bookings: { $sum: 1 }, revenue: { $sum: '$amount' } } },
            { $sort: { bookings: -1 } },
            { $limit: 8 },
            { $project: { _id: 0, genre: '$_id', bookings: 1, revenue: 1 } },
        ]),
        Booking.aggregate([
            { $match: bookingMatch },
            { $addFields: { showObjectId: { $toObjectId: '$show' } } },
            { $lookup: { from: 'shows', localField: 'showObjectId', foreignField: '_id', as: 'showDoc' } },
            { $unwind: '$showDoc' },
            { $match: { 'showDoc.communityHostId': { $ne: null } } },
            {
                $lookup: {
                    from: 'communityhosts',
                    localField: 'showDoc.communityHostId',
                    foreignField: '_id',
                    as: 'hostDoc',
                },
            },
            { $unwind: '$hostDoc' },
            {
                $group: {
                    _id: '$hostDoc._id',
                    hostName: { $first: '$hostDoc.organizationName' },
                    revenueSplitPercent: { $first: '$showDoc.revenueSplitPercent' },
                    totalRevenue: { $sum: '$amount' },
                    bookings: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    hostId: '$_id',
                    hostName: 1,
                    revenueSplitPercent: 1,
                    totalRevenue: 1,
                    hostShare: { $round: [{ $multiply: ['$totalRevenue', { $divide: ['$revenueSplitPercent', 100] }] }, 2] },
                    theaterShare: { $round: [{ $multiply: ['$totalRevenue', { $divide: [{ $subtract: [100, '$revenueSplitPercent'] }, 100] }] }, 2] },
                    bookings: 1,
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]),
    ]);

    const showMatch = {
        showDateTime: { $gte: from, $lte: to },
        isCancelled: { $ne: true },
    };
    if (scopedTheaterId) {
        showMatch.screen = { $in: await getScreenIdsForTheater(scopedTheaterId) };
    }

    const occupancyByShow = await Show.aggregate([
        { $match: showMatch },
        {
            $lookup: {
                from: 'screens',
                localField: 'screen',
                foreignField: '_id',
                as: 'screenDoc',
            },
        },
        { $unwind: '$screenDoc' },
        {
            $lookup: {
                from: 'movies',
                localField: 'movie',
                foreignField: '_id',
                as: 'movieDoc',
            },
        },
        { $unwind: '$movieDoc' },
        {
            $project: {
                _id: 1,
                showDateTime: 1,
                title: '$movieDoc.title',
                totalCapacity: '$screenDoc.totalCapacity',
                occupiedCount: { $size: { $objectToArray: '$occupiedSeats' } },
            },
        },
        {
            $project: {
                _id: 1,
                showDateTime: 1,
                title: 1,
                totalCapacity: 1,
                occupiedCount: 1,
                occupancyPct: {
                    $cond: [
                        { $gt: ['$totalCapacity', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$occupiedCount', '$totalCapacity'] }, 100] }, 1] },
                        0,
                    ],
                },
            },
        },
        { $sort: { showDateTime: 1 } },
        { $limit: 100 },
    ]);

    res.json({
        success: true,
        analytics: {
            range: { from, to },
            revenueTrend,
            topMovies,
            topTheaters,
            genreDistribution,
            occupancyByShow,
            communityRevenue,
        },
    });
});


const RECENT_ACTIVITY_LIMIT = 20;

export const getRecentActivity = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const match = {};
    if (role === 'theaterAdmin') {
        match.show = { $in: await getShowIdsForTheater(theaterId) };
    }

    const bookings = await Booking.aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        { $limit: RECENT_ACTIVITY_LIMIT },
        { $addFields: { showObjectId: { $toObjectId: '$show' } } },
        { $lookup: { from: 'shows', localField: 'showObjectId', foreignField: '_id', as: 'showDoc' } },
        { $unwind: { path: '$showDoc', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'movies', localField: 'showDoc.movie', foreignField: '_id', as: 'movieDoc' } },
        { $unwind: { path: '$movieDoc', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                status: 1,
                isPaid: 1,
                amount: 1,
                bookedSeats: 1,
                createdAt: 1,
                updatedAt: 1,
                movieTitle: '$movieDoc.title',
            },
        },
    ]);

    res.json({ success: true, events: bookings });
});


const BOOKINGS_CSV_HEADER = [
    'Booking ID', 'User Name', 'User Email', 'Movie', 'Show Time',
    'Seats', 'Amount', 'Payment Status', 'Booked At',
];

export const exportBookingsCsv = asyncHandler(async (req, res) => {
    const { from, to } = parseDateRange(req.query);
    const scopedTheaterId = resolveAnalyticsTheaterId(req.adminContext, req.query);

    const showIds = scopedTheaterId ? await getShowIdsForTheater(scopedTheaterId) : null;

    const bookingMatch = {
        isPaid: true,
        createdAt: { $gte: from, $lte: to },
    };
    if (showIds) {
        bookingMatch.show = { $in: showIds };
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv"`);

    res.write(csvRow(BOOKINGS_CSV_HEADER));

    const cursor = Booking.find(bookingMatch)
        .populate('user')
        .populate({ path: 'show', populate: { path: 'movie' } })
        .sort({ createdAt: 1 })
        .cursor();

    for await (const booking of cursor) {
        const seats = (booking.bookedSeats || []).join(', ');

        res.write(csvRow([
            booking._id.toString(),
            booking.user?.name || 'Unknown user',
            booking.user?.email || '',
            booking.show?.movie?.title || 'Show no longer available',
            booking.show?.showDateTime ? booking.show.showDateTime.toISOString() : '',
            seats,
            booking.amount,
            booking.status,
            booking.createdAt.toISOString(),
        ]));
    }

    res.end();
});


export const getAllShows = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { showDateTime: { $gte: new Date() } };

    if (role === 'theaterAdmin') {
        filter.screen = { $in: await getScreenIdsForTheater(theaterId) };
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [shows, total] = await Promise.all([
        Show.find(filter)
            .populate('movie')
            .populate({ path: 'screen', populate: { path: 'theater' } })
            .sort({ showDateTime: 1 })
            .skip(skip)
            .limit(limit),
        Show.countDocuments(filter),
    ]);

    res.json({ success: true, shows, pageInfo: buildPageMeta(page, limit, total) })
});


export const getAllBookings = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { isPaid: true };

    if (role === 'theaterAdmin') {
        filter.show = { $in: await getShowIdsForTheater(theaterId) };
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [bookings, total] = await Promise.all([
        Booking.find(filter).populate('user').populate({
            path: "show",
            populate: [{ path: "movie" }, { path: "screen", populate: { path: "theater" } }],
        }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Booking.countDocuments(filter),
    ]);

    res.json({ success: true, bookings, pageInfo: buildPageMeta(page, limit, total) });
});


export const getAuditLog = asyncHandler(async (req, res) => {
    const { actorId, entityType, from, to } = req.query;

    if (entityType && !AUDIT_ENTITY_TYPES.includes(entityType)) {
        throw new AppError(`entityType must be one of ${AUDIT_ENTITY_TYPES.join(', ')}`, 400, 'INVALID_INPUT');
    }

    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (entityType) filter.entityType = entityType;

    if (from || to) {
        filter.createdAt = {};
        if (from) {
            const fromDate = new Date(from);
            if (Number.isNaN(fromDate.getTime())) throw new AppError('Invalid "from" date', 400, 'INVALID_INPUT');
            filter.createdAt.$gte = fromDate;
        }
        if (to) {
            const toDate = new Date(to);
            if (Number.isNaN(toDate.getTime())) throw new AppError('Invalid "to" date', 400, 'INVALID_INPUT');
            toDate.setUTCHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
        }
        if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) {
            throw new AppError('"from" must be before "to"', 400, 'INVALID_INPUT');
        }
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [entries, total] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        AuditLog.countDocuments(filter),
    ]);

    const actorIds = [...new Set(entries.map((e) => e.actorId))];
    const actors = await User.find({ _id: { $in: actorIds } }).select('name image');
    const actorById = Object.fromEntries(actors.map((a) => [a._id, { name: a.name, image: a.image }]));

    const enrichedEntries = entries.map((e) => ({
        ...e.toObject(),
        actorName: actorById[e.actorId]?.name || null,
        actorImage: actorById[e.actorId]?.image || null,
    }));

    res.json({ success: true, entries: enrichedEntries, pageInfo: buildPageMeta(page, limit, total) });
});
