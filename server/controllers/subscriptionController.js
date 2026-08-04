import stripe from 'stripe';
import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import SubscriptionUsage from '../models/SubscriptionUsage.js';
import Show from '../models/Show.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { isShowBingePassEligible } from '../utils/bingePassEligibility.js';
import { SCREEN_WITH_THEATER, resolveTheaterContext } from '../utils/theaterScope.js';

const BINGE_PASS_PRICE_ID = process.env.STRIPE_BINGE_PASS_PRICE_ID;

const getStripe = () => new stripe(process.env.STRIPE_SECRET_KEY);

export const subscribeToBingePass = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { origin } = req.headers;

    const existing = await Subscription.findOne({ user: userId, status: { $in: ['active', 'trialing', 'past_due'] } });
    if (existing) {
        throw new AppError('You already have an active Binge Pass subscription', 409, 'SUBSCRIPTION_ALREADY_ACTIVE');
    }

    const stripeInstance = getStripe();

    const session = await stripeInstance.checkout.sessions.create({
        success_url: `${origin}/my-bookings#binge-pass`,
        cancel_url: `${origin}/my-bookings`,
        mode: 'subscription',
        line_items: [{ price: BINGE_PASS_PRICE_ID, quantity: 1 }],
        metadata: {
            userId,
            plan: 'binge_pass_monthly',
        },
        subscription_data: {
            metadata: {
                userId,
                plan: 'binge_pass_monthly',
            },
        },
    });

    res.json({ success: true, url: session.url });
});

export const getBingePassStatus = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || subscription.status === 'canceled') {
        return res.json({
            success: true,
            subscribed: false,
            plan: null,
            creditsRemaining: 0,
            creditsPerCycle: 0,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        });
    }

    res.json({
        success: true,
        subscribed: true,
        plan: subscription.plan,
        status: subscription.status,
        creditsRemaining: subscription.creditsRemaining,
        creditsPerCycle: subscription.creditsPerCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
});

export const getBingePassManageUrl = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const subscription = await Subscription.findOne({ user: userId, status: { $in: ['active', 'trialing', 'past_due'] } });
    if (!subscription) {
        throw new AppError('No active Binge Pass subscription found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const stripeInstance = getStripe();

    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
        const customer = await stripeInstance.customers.create({
            metadata: { userId },
        });
        customerId = customer.id;
        subscription.stripeCustomerId = customerId;
        await subscription.save();
    }

    const session = await stripeInstance.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/my-bookings#binge-pass`,
    });

    res.json({ success: true, url: session.url });
});

export const checkBingePassEligibility = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { showId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
        throw new AppError('Invalid showId', 400, 'INVALID_INPUT');
    }

    const show = await Show.findById(showId).populate(SCREEN_WITH_THEATER);
    if (!show || show.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const subscription = await Subscription.findOne({ user: userId, status: { $in: ['active', 'trialing'] } });

    if (!subscription) {
        return res.json({ success: true, eligible: false, reason: 'no_subscription', showEligible: false });
    }

    const { theaterId, timezone } = resolveTheaterContext(show);
    const showEligible = await isShowBingePassEligible(show, theaterId, timezone);

    const eligible = showEligible && subscription.creditsRemaining > 0;

    res.json({
        success: true,
        eligible,
        reason: eligible
            ? null
            : !showEligible
                ? 'premium_show'
                : 'no_credits',
        showEligible,
        creditsRemaining: subscription.creditsRemaining,
        creditsPerCycle: subscription.creditsPerCycle,
    });
});

export async function redeemBingePassCredit({ userId, bookingId, showId }) {
    const subscription = await Subscription.findOne({
        user: userId,
        status: { $in: ['active', 'trialing'] },
    });

    if (!subscription) {
        throw new AppError('No active Binge Pass subscription', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    if (subscription.creditsRemaining <= 0) {
        throw new AppError('No Binge Pass credits remaining', 400, 'NO_CREDITS_REMAINING');
    }

    const existingUsage = await SubscriptionUsage.findOne({
        user: userId,
        show: showId,
        billingPeriodStart: subscription.currentPeriodStart,
    });
    if (existingUsage) {
        throw new AppError('You can only use one Binge Pass credit per showtime', 409, 'CREDIT_ALREADY_USED_FOR_SHOW');
    }

    const updated = await Subscription.findOneAndUpdate(
        {
            _id: subscription._id,
            creditsRemaining: { $gt: 0 },
        },
        { $inc: { creditsRemaining: -1 } },
        { new: true }
    );

    if (!updated) {
        throw new AppError('No Binge Pass credits remaining', 400, 'NO_CREDITS_REMAINING');
    }

    const usage = await SubscriptionUsage.create({
        user: userId,
        subscription: subscription._id,
        booking: bookingId,
        show: showId,
        creditsUsed: 1,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
    });

    return { subscription: updated, usage };
}

export async function refundBingePassCredit({ userId, bookingId }) {
    const usage = await SubscriptionUsage.findOne({ user: userId, booking: bookingId });
    if (!usage) return null;

    const subscription = await Subscription.findOne({
        _id: usage.subscription,
        status: { $in: ['active', 'trialing', 'past_due'] },
    });

    if (subscription) {
        await Subscription.updateOne(
            { _id: subscription._id },
            { $inc: { creditsRemaining: usage.creditsUsed } }
        );
    }

    await SubscriptionUsage.deleteOne({ _id: usage._id });
    return usage;
}