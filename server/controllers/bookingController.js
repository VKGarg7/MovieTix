import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';


const MAX_SEATS_PER_BOOKING = 5;
const SEAT_PATTERN = /^[A-J][1-9]$/;

export const createBooking = asyncHandler(async(req , res)=> {
    const {userId} = req.auth();
    const {showId , selectedSeats} = req.body;
    const {origin} =  req.headers;

    // validate input
    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        throw new AppError('showId and selectedSeats are required', 400, 'INVALID_INPUT');
    }
    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
        throw new AppError(`You can book at most ${MAX_SEATS_PER_BOOKING} seats`, 400, 'TOO_MANY_SEATS');
    }
    if (!selectedSeats.every(seat => typeof seat === 'string' && SEAT_PATTERN.test(seat))) {
        throw new AppError('Invalid seat selection', 400, 'INVALID_SEATS');
    }

    // atomically reserve the seats: only succeeds if none of them are already taken
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

    //create a new booking
    const booking = await Booking.create({
        user: userId,
        show: showId,
        amount: showData.showPrice * selectedSeats.length,
        bookedSeats: selectedSeats
    })

    try {
        // stripe gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // creating line items for Stripe payment
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
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // expires in 30 minutes
        })

        booking.paymentLink = session.url
        await booking.save()

        // run inngest scheduler to check payment status after 10 minutes
        await inngest.send({
            name: 'app/checkpayment',
            data: {
                bookingId: booking._id.toString()
            }
        })

        req.log.info({ bookingId: booking._id.toString(), showId, userId }, 'Booking created, checkout session started');
        res.json({success: true, url: session.url});

    } catch (error) {
        // payment setup failed: release the reserved seats and remove the booking
        req.log.error({ err: error, bookingId: booking._id.toString(), showId }, 'Stripe checkout setup failed, releasing seats');
        await Show.findByIdAndUpdate(showId, {
            $unset: Object.fromEntries(selectedSeats.map(seat => [`occupiedSeats.${seat}`, ""]))
        });
        await Booking.findByIdAndDelete(booking._id);
        throw error;
    }
});


// API to get the payment status of a booking (used by the client to poll after checkout)
export const getBookingStatus = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking || booking.user !== userId) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    res.json({success: true, isPaid: booking.isPaid});
});


export const getOccupiedSeats = asyncHandler(async(req, res) => {
    const {showId} = req.params;
    const showData = await Show.findById(showId)

    if (!showData) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats)

    req.log.debug({ showId, occupiedCount: occupiedSeats.length }, 'Seat availability polled');
    res.json({success: true, occupiedSeats})
});
