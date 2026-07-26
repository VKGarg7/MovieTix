import { createEvent } from 'ics';
import AppError from './AppError.js';

const FALLBACK_RUNTIME_MINUTES = 120;

const dateToIcsArray = (date) => ([
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
]);

export const buildBookingIcs = ({ movieTitle, runtimeMinutes, showDateTime, theater, bookingId }) => {
    const runtime = Number.isFinite(runtimeMinutes) && runtimeMinutes > 0 ? runtimeMinutes : FALLBACK_RUNTIME_MINUTES;
    const start = new Date(showDateTime);
    const location = theater ? `${theater.name}, ${theater.address}, ${theater.city}` : undefined;

    const { error, value } = createEvent({
        start: dateToIcsArray(start),
        startInputType: 'utc',
        duration: { minutes: runtime },
        title: movieTitle,
        description: `Your booking for "${movieTitle}" at ${theater?.name ?? 'the theater'}.`,
        location,
        uid: `booking-${bookingId}@movietix`,
        status: 'CONFIRMED',
        productId: 'movietix/ics',
    });

    if (error) {
        throw new AppError('Failed to generate calendar event', 500, 'ICS_GENERATION_FAILED');
    }

    return value;
};
