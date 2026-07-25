import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getScreenIdsForTheater, getShowIdsForTheater } from '../utils/theaterScope.js';

// API to check if user is admin, and which role they hold
export const isAdmin = (req, res) => {
    res.json({ success: true, isAdmin: true, role: req.adminContext.role })
}

// Shows a preview of this many upcoming shows on the dashboard; the stat
// card's count comes from a separate countDocuments, not this array's length.
const DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT = 12;

// API to get dashboard data
export const getDashboardData = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const showFilter = { showDateTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } };
    const bookingFilter = { isPaid: true };

    if (role === 'theaterAdmin') {
        showFilter.screen = { $in: await getScreenIdsForTheater(theaterId) };
        bookingFilter.show = { $in: await getShowIdsForTheater(theaterId) };
    }

    // Sum/count via aggregation instead of fetching every Booking/Show document
    // just to read .length or reduce over .amount — this scales independently
    // of how many bookings/shows exist.
    const [bookingStats] = await Booking.aggregate([
        { $match: bookingFilter },
        { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
    ]);

    const activeShowsCount = await Show.countDocuments(showFilter);
    const activeShows = await Show.find(showFilter)
        .sort({ showDateTime: 1 })
        .limit(DASHBOARD_ACTIVE_SHOWS_PREVIEW_LIMIT)
        .populate('movie');

    // Theater-scoped totalUser has no clean definition yet (users aren't
    // theater-scoped), so only super-admins get a real platform-wide count.
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



// API to get all shows (scoped to the caller's theater unless super-admin)
export const getAllShows = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { showDateTime: { $gte: new Date() } };

    if (role === 'theaterAdmin') {
        filter.screen = { $in: await getScreenIdsForTheater(theaterId) };
    }

    const shows = await Show.find(filter).populate('movie').sort({ showDateTime: 1 });
    res.json({success: true, shows})
});


// API to get all bookings (scoped to the caller's theater unless super-admin)
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
