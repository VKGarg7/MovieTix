import stripe from 'stripe';
import Booking from '../models/Booking.js';
import {inngest} from '../inngest/index.js';
import { awardPoints } from '../utils/loyaltyPoints.js';
import { grantReferralRewardIfEligible } from '../utils/referrals.js';
import { updateClaimsForSeats } from '../utils/groupBookingClaims.js';

export const stripeWebhooks = async (request , response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];
    const log = request.log;

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        log.warn({ err: error }, 'Stripe webhook signature verification failed');
        return response.status(400).send(`Webhook Error: ${error}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":{
                const session = event.data.object;
                const {bookingId} = session.metadata;

                const booking = await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink: "",
                    paymentIntentId: session.payment_intent,
                    status: 'confirmed'
                }, { new: true })

                await awardPoints(booking.user, bookingId, booking.amount);
                await grantReferralRewardIfEligible(booking.user);

                if (booking.groupBookingId) {
                    const seatsToMark = booking.groupBookingSeats?.length ? booking.groupBookingSeats : booking.bookedSeats;
                    // userId guard is defense-in-depth against any theoretical
                    // reclaim race between checkout-session creation and webhook delivery.
                    await updateClaimsForSeats(booking.groupBookingId, seatsToMark, { isPaid: true }, {
                        extraArrayFilterFields: { userId: booking.user },
                    });
                    log.info({ bookingId, groupBookingId: booking.groupBookingId.toString() }, 'Group claim marked paid');
                }

                await inngest.send({
                    name: 'app/show.booked',
                    data: {bookingId}
                })

                log.info({ bookingId }, 'Booking marked as paid');
                break;
            }

            default:
                log.debug({ eventType: event.type }, 'Unhandled Stripe event type');
        }
        response.json({received: true});
    } catch (error) {
        log.error({ err: error }, 'Error processing Stripe webhook');
        response.status(500).send('Internal Server Error');
    }
}
