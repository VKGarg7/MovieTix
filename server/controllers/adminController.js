import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// API to check if user is admin
export const isAdmin = (req, res) => {
    res.json({ success: true, isAdmin: true })
}


// API to get dashboard data
export const getDashboardData = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ isPaid: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeShows = await Show.find({ showDateTime: { $gte: today} }).populate('movie');

    const totalUser = await User.countDocuments();

    const dashboardData = {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
        activeShows,
        totalUser
    }

    res.json({ success: true, dashboardData });
});



// API to get all shows
export const getAllShows = asyncHandler(async (req, res) => {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });
    res.json({success: true, shows})
});


// API to get all bookings
export const getAllBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ isPaid: true }).populate('user').populate({
        path: "show",
        populate: {path: "movie"}
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
});
