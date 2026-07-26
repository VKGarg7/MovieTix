import stripe from 'stripe';
import Booking from '../models/Booking.js';
import {inngest} from '../inngest/index.js';

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

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink: "",
                    paymentIntentId: session.payment_intent,
                    status: 'confirmed'
                })

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
