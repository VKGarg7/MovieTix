import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { buildSeatCapacityByRow, isSeatValidForScreen } from '../utils/seatId.js';
import { buildBookingIcs } from '../utils/calendarEvent.js';
import { releaseSeatsAtomic, occupySeatsAtomic } from '../utils/seatOperations.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { loadOwnedBooking } from '../utils/bookingOwnership.js';


const MAX_SEATS_PER_BOOKING = 5;

export const createBooking = asyncHandler(async(req , res)=> {
    const {userId} = req.auth();
    const {showId , selectedSeats} = req.body;
    const {origin} =  req.headers;

    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        throw new AppError('showId and selectedSeats are required', 400, 'INVALID_INPUT');
    }
    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
        throw new AppError(`You can book at most ${MAX_SEATS_PER_BOOKING} seats`, 400, 'TOO_MANY_SEATS');
    }

    const showForSeatCheck = await Show.findById(showId).populate('screen');
    if (!showForSeatCheck || showForSeatCheck.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const seatCapacityByRow = buildSeatCapacityByRow(showForSeatCheck.screen);
    if (!selectedSeats.every(seat => isSeatValidForScreen(seat, seatCapacityByRow))) {
        throw new AppError('Invalid seat selection', 400, 'INVALID_SEATS');
    }

    const seatConditions = selectedSeats.map(seat => ({ [`occupiedSeats.${seat}`]: { $exists: false } }));
    const seatUpdates = Object.fromEntries(selectedSeats.map(seat => [`occupiedSeats.${seat}`, userId]));

    const showData = await Show.findOneAndUpdate(
        { _id: showId, $and: seatConditions },
        { $set: seatUpdates },
        { new: true }
    ).populate('movie');

    if(!showData) {
        const showExists = await Show.exists({ _id: showId });
        throw new AppError(
            showExists ? "Selected seats are not available" : "Show not found",
            showExists ? 409 : 404,
            showExists ? 'SEATS_UNAVAILABLE' : 'SHOW_NOT_FOUND'
        );
    }

    const booking = await Booking.create({
        user: userId,
        show: showId,
        amount: showData.showPrice * selectedSeats.length,
        bookedSeats: selectedSeats
    })

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: Math.round(booking.amount * 100)
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings?booking=${booking._id}`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        })

        booking.paymentLink = session.url
        await booking.save()

        await inngest.send({
            name: 'app/checkpayment',
            data: {
                bookingId: booking._id.toString()
            }
        })

        req.log.info({ bookingId: booking._id.toString(), showId, userId }, 'Booking created, checkout session started');
        res.json({success: true, url: session.url});

    } catch (error) {
        req.log.error({ err: error, bookingId: booking._id.toString(), showId }, 'Stripe checkout setup failed, releasing seats');
        await releaseSeatsAtomic(showId, selectedSeats);
        await Booking.findByIdAndDelete(booking._id);
        throw error;
    }
});


export const getBookingStatus = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await loadOwnedBooking(req.params.bookingId, userId);

    res.json({success: true, isPaid: booking.isPaid});
});


export const getBookingCalendar = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await loadOwnedBooking(req.params.bookingId, userId);

    if (!booking.isPaid) {
        throw new AppError('Only paid bookings have a calendar event', 400, 'BOOKING_NOT_PAID');
    }

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const movie = await Movie.findById(show.movie);
    if (!movie) {
        throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
    }

    const icsContent = buildBookingIcs({
        movieTitle: movie.title,
        runtimeMinutes: movie.runtime,
        showDateTime: show.showDateTime,
        theater: show.screen?.theater,
        bookingId: booking._id.toString(),
    });

    res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${movie.title.replace(/[^a-z0-9]/gi, '_')}.ics"`,
    });
    res.send(icsContent);
});


export const cancelBooking = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const {bookingId} = req.params;

    const booking = await loadOwnedBooking(bookingId, userId);

    if (booking.status === 'cancelled') {
        throw new AppError('Booking is already cancelled', 409, 'ALREADY_CANCELLED');
    }
    if (booking.status === 'pending-cancellation') {
        throw new AppError('Booking cancellation is already being processed, please contact support', 409, 'CANCELLATION_PENDING');
    }
    if (!booking.isPaid || !booking.paymentIntentId) {
        throw new AppError('Only paid bookings can be cancelled', 400, 'BOOKING_NOT_PAID');
    }

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const cutoffHours = show.screen?.theater?.cancellationPolicy?.cutoffHoursBeforeShow ?? 2;
    const cutoffMs = cutoffHours * 60 * 60 * 1000;
    if (show.showDateTime.getTime() - Date.now() < cutoffMs) {
        throw new AppError(`Bookings can only be cancelled at least ${cutoffHours} hour(s) before the showtime`, 400, 'CANCELLATION_WINDOW_PASSED');
    }

    await releaseSeatsAtomic(booking.show, booking.bookedSeats);

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        await stripeInstance.refunds.create({ payment_intent: booking.paymentIntentId });

        booking.status = 'cancelled';
        booking.isPaid = false;
        await booking.save();

        req.log.info({ bookingId, userId }, 'Booking cancelled and refunded');
        res.json({ success: true, message: 'Booking cancelled and refund initiated' });
    } catch (error) {
        req.log.error({ err: error, bookingId }, 'Refund failed after seats released, re-occupying seats for manual review');
        await occupySeatsAtomic(booking.show, booking.bookedSeats, userId);
        booking.status = 'pending-cancellation';
        await booking.save();
        throw error;
    }
});


export const getOccupiedSeats = asyncHandler(async(req, res) => {
    const {showId} = req.params;
    const showData = await Show.findById(showId)

    if (!showData || showData.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats)

    req.log.debug({ showId, occupiedCount: occupiedSeats.length }, 'Seat availability polled');
    res.json({success: true, occupiedSeats})
});
