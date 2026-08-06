import stripe from 'stripe';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Subscription from '../models/Subscription.js';
import TicketTransfer from '../models/TicketTransfer.js';
import {inngest} from '../inngest/index.js';
import { awardPoints } from '../utils/loyaltyPoints.js';
import { grantReferralRewardIfEligible } from '../utils/referrals.js';
import { updateClaimsForSeats } from '../utils/groupBookingClaims.js';
import { createGiftCardWithUniqueCode } from '../utils/giftCardPricing.js';

const BINGE_PASS_CREDITS_PER_CYCLE = 4;

const upsertSubscription = async (stripeSubscription) => {
    const metadata = stripeSubscription.metadata || {};
    const userId = metadata.userId;

    if (!userId) {
        return null;
    }

    const periodStart = new Date(stripeSubscription.current_period_start * 1000);
    const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

    return Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeSubscription.id },
        {
            $set: {
                user: userId,
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId: stripeSubscription.customer,
                status: stripeSubscription.status,
                plan: 'binge_pass_monthly',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

const handleSubscriptionCheckoutCompleted = async (session) => {
    const { userId } = session.metadata || {};

    if (!userId || session.mode !== 'subscription') {
        return;
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const subscriptionId = session.subscription;
    if (!subscriptionId) return;

    const stripeSubscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
    await upsertSubscription(stripeSubscription);
};

const handleInvoicePaid = async (invoice) => {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const stripeSubscription = await stripeInstance.subscriptions.retrieve(subscriptionId);

    const subscription = await upsertSubscription(stripeSubscription);

    if (subscription) {
        subscription.creditsRemaining = BINGE_PASS_CREDITS_PER_CYCLE;
        await subscription.save();
    }
};

const handleSubscriptionUpdated = async (stripeSubscription) => {
    await upsertSubscription(stripeSubscription);
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (subscription) {
        subscription.status = 'canceled';
        await subscription.save();
    }
};

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

                if (session.mode === 'subscription') {
                    await handleSubscriptionCheckoutCompleted(session);
                    break;
                }

                if (session.metadata?.mode === 'gift_card') {
                    const { giftCardId } = session.metadata;
                    await inngest.send({ name: 'app/gift-card.purchased', data: { giftCardId } });
                    log.info({ giftCardId }, 'Gift card paid, dispatched for delivery');
                    break;
                }

                if (session.metadata?.mode === 'ticket_resale') {
                    const { transferId } = session.metadata;

                    const transfer = await TicketTransfer.findById(transferId);
                    if (!transfer || transfer.status !== 'claimed') {
                        log.error({ transferId }, 'Resale payment completed but transfer is not in claimed state');
                        break;
                    }

                    const booking = await Booking.findById(transfer.booking);
                    if (!booking) {
                        log.error({ transferId, bookingId: transfer.booking }, 'Resale payment completed but booking is missing');
                        break;
                    }

                    booking.user = transfer.claimedBy;
                    booking.ticketNonce = crypto.randomBytes(9).toString('base64url');
                    await booking.save();

                    const payoutExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                    const payoutGiftCard = await createGiftCardWithUniqueCode({
                        purchaserId: transfer.sellerId,
                        recipientEmail: null,
                        message: 'Resale payout',
                        initialBalance: transfer.resalePrice,
                        balance: transfer.resalePrice,
                        expiryDate: payoutExpiry,
                    });

                    await inngest.send({
                        name: 'app/ticket-transfer.resale-completed',
                        data: {
                            transferId: transfer._id.toString(),
                            bookingId: booking._id.toString(),
                            payoutGiftCardCode: payoutGiftCard.code,
                        },
                    });

                    log.info({ transferId, bookingId: booking._id.toString() }, 'Resale completed, ticket reassigned and seller paid out');
                    break;
                }

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

            case "invoice.paid": {
                await handleInvoicePaid(event.data.object);
                log.info({ invoiceId: event.data.object.id }, 'Subscription invoice paid, credits reset');
                break;
            }

            case "customer.subscription.updated": {
                await handleSubscriptionUpdated(event.data.object);
                log.info({ subscriptionId: event.data.object.id }, 'Subscription updated');
                break;
            }

            case "customer.subscription.deleted": {
                await handleSubscriptionDeleted(event.data.object);
                log.info({ subscriptionId: event.data.object.id }, 'Subscription cancelled');
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
