import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';


const MAX_SEATS_PER_BOOKING = 5;

// builds a { rowLetter: maxSeatNumber } map from a screen's row config,
// so we can validate a seat like "C7" actually exists on that screen
const buildSeatValidator = (screen) => {
    const rowLimits = new Map(screen.rows.map(r => [r.row, r.seats]));
    return (seat) => {
        const match = /^([A-Z])([1-9][0-9]?)$/.exec(seat);
        if (!match) return false;
        const [, row, num] = match;
        const maxSeats = rowLimits.get(row);
        return maxSeats !== undefined && Number(num) <= maxSeats;
    };
};

export const createBooking = async(req , res)=> {
    try {
        const {userId} = req.auth();
        const {showId , selectedSeats} = req.body;
        const {origin} =  req.headers;

        // validate input
        if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({success: false, message: "showId and selectedSeats are required"});
        }
        if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
            return res.status(400).json({success: false, message: `You can book at most ${MAX_SEATS_PER_BOOKING} seats`});
        }

        const showForValidation = await Show.findById(showId).populate('screen');
        if (!showForValidation) {
            return res.status(404).json({success: false, message: "Show not found"});
        }
        if (!showForValidation.screen) {
            return res.status(500).json({success: false, message: "Show is missing a screen configuration"});
        }

        const isValidSeat = buildSeatValidator(showForValidation.screen);
        if (!selectedSeats.every(seat => typeof seat === 'string' && isValidSeat(seat))) {
            return res.status(400).json({success: false, message: "Invalid seat selection"});
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
            return res.status(showExists ? 409 : 404).json({
                success: false,
                message: showExists ? "Selected seats are not available" : "Show not found"
            });
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

            res.json({success: true, url: session.url});

        } catch (error) {
            // payment setup failed: release the reserved seats and remove the booking
            await Show.findByIdAndUpdate(showId, {
                $unset: Object.fromEntries(selectedSeats.map(seat => [`occupiedSeats.${seat}`, ""]))
            });
            await Booking.findByIdAndDelete(booking._id);
            throw error;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: "Could not create booking"});
    }
}


// API to get the payment status of a booking (used by the client to poll after checkout)
export const getBookingStatus = async(req, res) => {
    try {
        const {userId} = req.auth();
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking || booking.user !== userId) {
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        res.json({success: true, isPaid: booking.isPaid});

    } catch (error) {
        console.error(error.message);
        res.status(500).json({success: false, message: "Could not fetch booking status"});
    }
}


export const getOccupiedSeats = async(req, res) => {
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        if (!showData) {
            return res.status(404).json({success: false, message: "Show not found"});
        }

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, occupiedSeats})

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});   
    }
}