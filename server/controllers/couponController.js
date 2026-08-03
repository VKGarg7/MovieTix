import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { computeDiscount } from '../utils/couponPricing.js';

export const findUsableCoupon = async (code, theaterId) => {
    if (!code) return null;

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
        throw new AppError('Invalid coupon code', 400, 'COUPON_INVALID');
    }
    if (!coupon.isActive) {
        throw new AppError('This coupon is no longer active', 400, 'COUPON_INVALID');
    }
    if (coupon.expiryDate.getTime() < Date.now()) {
        throw new AppError('This coupon has expired', 400, 'COUPON_EXPIRED');
    }
    if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('This coupon has reached its usage limit', 400, 'COUPON_LIMIT_REACHED');
    }
    if (coupon.theaterId && (!theaterId || coupon.theaterId.toString() !== theaterId.toString())) {
        throw new AppError('This coupon is not valid for the selected theater', 400, 'COUPON_INVALID');
    }

    return coupon;
};

export const redeemCouponAtomic = async (code, theaterId) => {
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    const filter = {
        code: normalizedCode,
        isActive: true,
        expiryDate: { $gt: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] },
    };
    if (theaterId) {
        filter.$or = [{ theaterId: null }, { theaterId }];
    } else {
        filter.theaterId = null;
    }

    const coupon = await Coupon.findOneAndUpdate(
        filter,
        { $inc: { usedCount: 1 } },
        { new: true }
    );

    if (!coupon) {
        throw new AppError('Coupon is no longer valid or has reached its usage limit', 409, 'COUPON_UNAVAILABLE');
    }

    return coupon;
};

export const releaseCouponAtomic = async (code) => {
    if (!code) return;
    await Coupon.updateOne(
        { code: code.trim().toUpperCase(), usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
    );
};

export const validateCoupon = asyncHandler(async (req, res) => {
    const { code, theaterId, amount } = req.body;

    if (!code || typeof amount !== 'number' || amount <= 0) {
        throw new AppError('code and amount are required', 400, 'INVALID_INPUT');
    }

    const coupon = await findUsableCoupon(code, theaterId);
    const discountAmount = computeDiscount(coupon, amount);

    res.json({
        success: true,
        discountAmount,
        finalAmount: amount - discountAmount,
    });
});

const validateCouponTypeAndValue = (type, value) => {
    if (!['flat', 'percent'].includes(type)) {
        throw new AppError("type must be 'flat' or 'percent'", 400, 'INVALID_INPUT');
    }
    if (type === 'percent' && value > 100) {
        throw new AppError('Percent value cannot exceed 100', 400, 'INVALID_INPUT');
    }
};

const loadCouponForAdmin = async (couponId) => {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
        throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }
    return coupon;
};

export const createCoupon = asyncHandler(async (req, res) => {
    const { code, type, value, expiryDate, usageLimit, theaterId } = req.body;

    if (!code || !type || value == null || !expiryDate || !usageLimit) {
        throw new AppError('code, type, value, expiryDate and usageLimit are required', 400, 'INVALID_INPUT');
    }
    validateCouponTypeAndValue(type, value);

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
        throw new AppError('A coupon with this code already exists', 409, 'COUPON_CODE_TAKEN');
    }

    const coupon = await Coupon.create({
        code: code.trim().toUpperCase(),
        type,
        value,
        expiryDate: new Date(expiryDate),
        usageLimit,
        theaterId: theaterId || null,
    });

    res.json({ success: true, coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    const { type, value, expiryDate, usageLimit, isActive } = req.body;

    const coupon = await loadCouponForAdmin(couponId);

    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    if (type !== undefined || value !== undefined) {
        validateCouponTypeAndValue(coupon.type, coupon.value);
    }

    await coupon.save();
    res.json({ success: true, coupon });
});

export const deactivateCoupon = asyncHandler(async (req, res) => {
    const coupon = await loadCouponForAdmin(req.params.couponId);
    coupon.isActive = false;
    await coupon.save();

    res.json({ success: true, coupon });
});

export const getAllCoupons = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    const [coupons, total] = await Promise.all([
        Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Coupon.countDocuments(),
    ]);

    res.json({ success: true, coupons, pageInfo: buildPageMeta(page, limit, total) });
});
