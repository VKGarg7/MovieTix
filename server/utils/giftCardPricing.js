import crypto from 'crypto';
import GiftCard from '../models/GiftCard.js';
import AppError from './AppError.js';

const CODE_LENGTH = 10;

const generateCode = () => crypto.randomBytes(8).toString('base64url').slice(0, CODE_LENGTH).toUpperCase();

export const createGiftCardWithUniqueCode = async (fields) => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            return await GiftCard.create({ ...fields, code: generateCode() });
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }
    throw new Error('Failed to generate a unique gift card code after 5 attempts');
};

export const findUsableGiftCard = async (code) => {
    if (!code) return null;

    const giftCard = await GiftCard.findOne({ code: code.trim().toUpperCase() });
    if (!giftCard) {
        throw new AppError('Invalid gift card code', 400, 'GIFT_CARD_INVALID');
    }
    if (giftCard.status !== 'active') {
        throw new AppError('This gift card is no longer active', 400, 'GIFT_CARD_INVALID');
    }
    if (giftCard.expiryDate.getTime() < Date.now()) {
        throw new AppError('This gift card has expired', 400, 'GIFT_CARD_EXPIRED');
    }
    if (giftCard.balance <= 0) {
        throw new AppError('This gift card has no remaining balance', 400, 'GIFT_CARD_DEPLETED');
    }

    return giftCard;
};

export const redeemGiftCardAtomic = async (code, amount, userId) => {
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    const candidate = await GiftCard.findOne({
        code: normalizedCode, status: 'active', expiryDate: { $gt: now }, balance: { $gt: 0 },
    });
    if (!candidate) {
        throw new AppError('Gift card is invalid, expired, or has no remaining balance', 409, 'GIFT_CARD_UNAVAILABLE');
    }

    const amountUsed = Math.min(candidate.balance, amount);
    const newBalance = candidate.balance - amountUsed;

    const giftCard = await GiftCard.findOneAndUpdate(
        { _id: candidate._id, status: 'active', balance: candidate.balance },
        {
            $set: { balance: newBalance, status: newBalance <= 0 ? 'depleted' : 'active' },
            $addToSet: { redeemedBy: userId },
        },
        { new: true }
    );

    if (!giftCard) {
        throw new AppError('Gift card balance changed, please try again', 409, 'GIFT_CARD_UNAVAILABLE');
    }

    return { code: giftCard.code, amountUsed };
};

export const refundGiftCardAtomic = async (code, amountUsed) => {
    if (!code || !amountUsed) return;
    await GiftCard.updateOne(
        { code: code.trim().toUpperCase() },
        { $inc: { balance: amountUsed }, $set: { status: 'active' } }
    );
};
