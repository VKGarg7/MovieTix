import { DateTime } from 'luxon';
import PricingRule from '../models/PricingRule.js';

const MIN_PRICE_FRACTION = 0.1;

const ruleApplies = (rule, { showDateTime, bookingTime, timezone }) => {
    if (rule.type === 'time_of_week') {
        const showLocal = DateTime.fromJSDate(showDateTime, { zone: timezone });
        const hour = showLocal.hour;
        const weekday = showLocal.weekday % 7;
        return rule.daysOfWeek.includes(weekday) && hour >= rule.startHour && hour < rule.endHour;
    }

    if (rule.type === 'early_bird') {
        const daysBefore = DateTime.fromJSDate(showDateTime).diff(DateTime.fromJSDate(bookingTime), 'days').days;
        return daysBefore >= rule.minDaysBeforeShow;
    }

    return false;
};

export const fetchApplicableRules = async (theaterId) => {
    return PricingRule.find({
        isActive: true,
        $or: [{ theaterId: null }, { theaterId }],
    });
};

export const computeShowPrice = (basePrice, rules, { showDateTime, timezone, bookingTime = new Date() }) => {
    const matching = rules.filter(rule => ruleApplies(rule, { showDateTime, bookingTime, timezone }));
    const surcharges = matching.filter(r => r.adjustmentPercent > 0);
    const discounts = matching.filter(r => r.adjustmentPercent < 0);

    let price = basePrice;
    for (const rule of surcharges) {
        price += basePrice * (rule.adjustmentPercent / 100);
    }
    for (const rule of discounts) {
        price += basePrice * (rule.adjustmentPercent / 100);
    }

    price = Math.max(price, basePrice * MIN_PRICE_FRACTION);
    return Math.round(price * 100) / 100;
};

export const getComputedPriceForShow = async (show, theaterId, timezone, bookingTime) => {
    const rules = await fetchApplicableRules(theaterId);
    return computeShowPrice(show.showPrice, rules, { showDateTime: show.showDateTime, timezone, bookingTime });
};
