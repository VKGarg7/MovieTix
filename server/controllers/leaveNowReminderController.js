import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { loadOwnedBooking } from '../utils/bookingOwnership.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';

export const optInToLeaveNowReminder = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { bookingId } = req.params;
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('A valid {lat, lng} is required', 400, 'INVALID_INPUT');
    }

    const booking = await loadOwnedBooking(bookingId, userId);
    if (!booking.isPaid || booking.status !== 'confirmed') {
        throw new AppError('Only confirmed, paid bookings can opt in', 400, 'BOOKING_NOT_ELIGIBLE');
    }

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show || show.showDateTime.getTime() <= Date.now()) {
        throw new AppError('This showtime has already passed', 400, 'SHOWTIME_PASSED');
    }
    if (!show.screen?.theater?.geolocation) {
        throw new AppError('This theater has no location on file yet', 409, 'THEATER_LOCATION_MISSING');
    }

    booking.leaveNowReminderOptedIn = true;
    await booking.save();

    await inngest.send({
        name: 'app/leave-now-reminder.optin',
        data: {
            bookingId: booking._id.toString(),
            originLat: lat,
            originLng: lng,
        },
    });

    req.log.info({ bookingId, userId }, 'User opted in to traffic-aware leave-now reminder');
    res.json({ success: true });
});
