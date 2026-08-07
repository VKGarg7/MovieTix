import PricingRule from '../models/PricingRule.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { loadTheaterScopedResource, resolveTheaterIdForCreate } from '../utils/theaterScope.js';

const validateAdjustmentPercent = (value) => {
    if (typeof value !== 'number' || value < -100 || value > 100 || value === 0) {
        throw new AppError('adjustmentPercent must be a non-zero number between -100 and 100', 400, 'INVALID_INPUT');
    }
};

const validateTypeFields = (type, body) => {
    if (type === 'time_of_week') {
        const { daysOfWeek, startHour, endHour } = body;
        if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || !daysOfWeek.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
            throw new AppError('daysOfWeek must be a non-empty array of integers 0-6 (0=Sunday)', 400, 'INVALID_INPUT');
        }
        if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
            throw new AppError('startHour must be an integer 0-23', 400, 'INVALID_INPUT');
        }
        if (!Number.isInteger(endHour) || endHour <= startHour || endHour > 24) {
            throw new AppError('endHour must be an integer greater than startHour, up to 24', 400, 'INVALID_INPUT');
        }
        return { daysOfWeek, startHour, endHour };
    }

    if (type === 'early_bird') {
        const { minDaysBeforeShow } = body;
        if (!Number.isInteger(minDaysBeforeShow) || minDaysBeforeShow < 0) {
            throw new AppError('minDaysBeforeShow must be a non-negative integer', 400, 'INVALID_INPUT');
        }
        return { minDaysBeforeShow };
    }

    throw new AppError("type must be 'time_of_week' or 'early_bird'", 400, 'INVALID_INPUT');
};

export const createPricingRule = asyncHandler(async (req, res) => {
    const { name, type, adjustmentPercent, theaterId } = req.body;

    if (!name || !type || adjustmentPercent === undefined) {
        throw new AppError('name, type and adjustmentPercent are required', 400, 'INVALID_INPUT');
    }
    validateAdjustmentPercent(adjustmentPercent);

    // theaterAdmins can only create rules scoped to their own theater; superAdmins may create global rules or scope to any theater.
    const resolvedTheaterId = resolveTheaterIdForCreate(req.adminContext, theaterId, { allowNullForSuperAdmin: true });

    const typeFields = validateTypeFields(type, req.body);

    const rule = await PricingRule.create({
        name,
        type,
        adjustmentPercent,
        theaterId: resolvedTheaterId,
        ...typeFields,
    });

    res.json({ success: true, rule });
});

export const updatePricingRule = asyncHandler(async (req, res) => {
    const { ruleId } = req.params;
    const { name, adjustmentPercent, isActive } = req.body;

    const rule = await loadTheaterScopedResource(PricingRule, ruleId, req.adminContext, 'Pricing rule');

    if (name !== undefined) rule.name = name;
    if (isActive !== undefined) rule.isActive = isActive;
    if (adjustmentPercent !== undefined) {
        validateAdjustmentPercent(adjustmentPercent);
        rule.adjustmentPercent = adjustmentPercent;
    }

    const typeFields = validateTypeFields(rule.type, { ...rule.toObject(), ...req.body });
    Object.assign(rule, typeFields);

    await rule.save();
    res.json({ success: true, rule });
});

export const deletePricingRule = asyncHandler(async (req, res) => {
    const rule = await loadTheaterScopedResource(PricingRule, req.params.ruleId, req.adminContext, 'Pricing rule');
    await rule.deleteOne();

    res.json({ success: true, message: 'Pricing rule deleted' });
});

export const getAllPricingRules = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = { source: 'admin', ...(role === 'theaterAdmin' ? { theaterId } : {}) };

    const { page, limit, skip } = parsePagination(req.query);

    const [rules, total] = await Promise.all([
        PricingRule.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        PricingRule.countDocuments(filter),
    ]);

    res.json({ success: true, rules, pageInfo: buildPageMeta(page, limit, total) });
});
