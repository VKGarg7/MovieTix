import stripe from 'stripe';
import GiftCard from '../models/GiftCard.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createGiftCardWithUniqueCode } from '../utils/giftCardPricing.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';

const MIN_AMOUNT = 5;
const MAX_AMOUNT = 500;
const DEFAULT_EXPIRY_DAYS = 365;

export const purchaseGiftCard = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { amount, recipientEmail, message } = req.body;
    const { origin } = req.headers;

    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        throw new AppError(`amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}`, 400, 'INVALID_INPUT');
    }
    if (!recipientEmail || typeof recipientEmail !== 'string') {
        throw new AppError('recipientEmail is required', 400, 'INVALID_INPUT');
    }

    const expiryDate = new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const giftCard = await createGiftCardWithUniqueCode({
        purchaserId: userId,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        message: message || '',
        initialBalance: amount,
        balance: amount,
        expiryDate,
    });

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/gift-card/purchased?giftCardId=${giftCard._id}`,
            cancel_url: `${origin}/gift-card/buy`,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'MovieTix Gift Card' },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { giftCardId: giftCard._id.toString(), mode: 'gift_card' },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        req.log.info({ giftCardId: giftCard._id.toString(), userId, amount }, 'Gift card purchase checkout started');
        res.json({ success: true, url: session.url, giftCardId: giftCard._id });
    } catch (error) {
        await GiftCard.findByIdAndDelete(giftCard._id);
        throw error;
    }
});


export const validateGiftCard = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
        throw new AppError('code is required', 400, 'INVALID_INPUT');
    }

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

    res.json({ success: true, balance: giftCard.balance, expiryDate: giftCard.expiryDate });
});


export const getMyGiftCards = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { page, limit, skip } = parsePagination(req.query);

    const [giftCards, total] = await Promise.all([
        GiftCard.find({ purchaserId: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        GiftCard.countDocuments({ purchaserId: userId }),
    ]);

    res.json({ success: true, giftCards, pageInfo: buildPageMeta(page, limit, total) });
});
