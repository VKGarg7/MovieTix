import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getScreenIdsForTheater, getShowIdsForTheater } from '../utils/theaterScope.js';

export const isAdmin = (req, res) => {
    res.json({ success: true, isAdmin: true, role: req.adminContext.role })
}

const DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT = 12;

export const getDashboardData = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const showFilter = { showDateTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, isCancelled: { $ne: true } };
    const bookingFilter = { isPaid: true };

    if (role === 'theaterAdmin') {
        showFilter.screen = { $in: await getScreenIdsForTheater(theaterId) };
        bookingFilter.show = { $in: await getShowIdsForTheater(theaterId) };
    }

    const [bookingStats] = await Booking.aggregate([
        { $match: bookingFilter },
        { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
    ]);

    const activeShowsCount = await Show.countDocuments(showFilter);
    const activeShows = await Show.find(showFilter)
        .sort({ showDateTime: 1 })
        .limit(DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT)
        .populate('movie');

    const totalUser = role === 'superAdmin' ? await User.countDocuments() : null;

    const dashboardData = {
        totalBookings: bookingStats?.totalBookings || 0,
        totalRevenue: bookingStats?.totalRevenue || 0,
        activeShowsCount,
        activeShows,
        totalUser
    }

    res.json({ success: true, dashboardData });
});



export const getAllShows = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { showDateTime: { $gte: new Date() } };

    if (role === 'theaterAdmin') {
        filter.screen = { $in: await getScreenIdsForTheater(theaterId) };
    }

    const shows = await Show.find(filter).populate('movie').sort({ showDateTime: 1 });
    res.json({success: true, shows})
});


export const getAllBookings = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { isPaid: true };

    if (role === 'theaterAdmin') {
        filter.show = { $in: await getShowIdsForTheater(theaterId) };
    }

    const bookings = await Booking.find(filter).populate('user').populate({
        path: "show",
        populate: {path: "movie"}
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
});
