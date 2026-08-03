import mongoose from 'mongoose';
import PointsTransaction from '../models/PointsTransaction.js';
import AppError from './AppError.js';

const POINTS_PER_CURRENCY_UNIT = 1;
const POINT_REDEMPTION_VALUE = 0.5;
const MAX_REDEMPTION_FRACTION_OF_AMOUNT = 0.5;

export const POINTS_CONFIG = {
    pointsPerCurrencyUnit: POINTS_PER_CURRENCY_UNIT,
    redemptionValue: POINT_REDEMPTION_VALUE,
    maxRedemptionFractionOfAmount: MAX_REDEMPTION_FRACTION_OF_AMOUNT,
};

export const pointsForAmount = (amount) => Math.floor(amount * POINTS_PER_CURRENCY_UNIT);

export const getPointsBalance = async (userId) => {
    const [result] = await PointsTransaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, balance: { $sum: '$delta' } } },
    ]);
    return result?.balance || 0;
};

export const awardPoints = async (userId, bookingId, amount) => {
    const points = pointsForAmount(amount);
    if (points <= 0) return;

    await PointsTransaction.create({
        user: userId,
        delta: points,
        reason: 'earned',
        booking: bookingId,
    });
};

export const reverseEarnedPoints = async (userId, bookingId) => {
    const alreadyReversed = await PointsTransaction.exists({ booking: bookingId, reason: 'reversed_earning' });
    if (alreadyReversed) return;

    const earned = await PointsTransaction.findOne({ booking: bookingId, reason: 'earned' });
    if (!earned) return;

    await PointsTransaction.create({
        user: userId,
        delta: -earned.delta,
        reason: 'reversed_earning',
        booking: bookingId,
    });
};

export const refundRedeemedPoints = async (userId, bookingId) => {
    const alreadyRefunded = await PointsTransaction.exists({ booking: bookingId, reason: 'refunded_redemption' });
    if (alreadyRefunded) return;

    const redemption = await PointsTransaction.findOne({ booking: bookingId, reason: 'redeemed' });
    if (!redemption) return;

    await PointsTransaction.create({
        user: userId,
        delta: -redemption.delta, 
        reason: 'refunded_redemption',
        booking: bookingId,
    });
};

export const computePointsDiscount = (pointsToRedeem, amount) => {
    const discount = pointsToRedeem * POINT_REDEMPTION_VALUE;
    return Math.min(discount, amount * MAX_REDEMPTION_FRACTION_OF_AMOUNT);
};

export const redeemPointsAtomic = async (userId, bookingId, pointsToRedeem, amount) => {
    if (!Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
        throw new AppError('pointsToRedeem must be a positive integer', 400, 'INVALID_INPUT');
    }

    const session = await mongoose.startSession();
    try {
        let discountAmount = 0;
        await session.withTransaction(async () => {
            const [result] = await PointsTransaction.aggregate([
                { $match: { user: userId } },
                { $group: { _id: null, balance: { $sum: '$delta' } } },
            ]).session(session);
            const balance = result?.balance || 0;

            if (balance < pointsToRedeem) {
                throw new AppError('Insufficient points balance', 400, 'INSUFFICIENT_POINTS');
            }

            discountAmount = computePointsDiscount(pointsToRedeem, amount);

            await PointsTransaction.create([{
                user: userId,
                delta: -pointsToRedeem,
                reason: 'redeemed',
                booking: bookingId,
            }], { session });
        });
        return discountAmount;
    } finally {
        await session.endSession();
    }
};
