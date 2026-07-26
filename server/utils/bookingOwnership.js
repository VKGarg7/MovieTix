import Booking from '../models/Booking.js';
import AppError from './AppError.js';

export const loadOwnedBooking = async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user !== userId) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }
    return booking;
};
