import PricingRule from '../models/PricingRule.js';
import { timeOfWeekRuleMatches } from './dynamicPricing.js';

export async function isShowBingePassEligible(show, theaterId, timezone) {
    if (!show || show.isCancelled) return false;

    const rules = await PricingRule.find({
        isActive: true,
        $or: [{ theaterId: null }, { theaterId }],
    });

    const isPeak = rules.some((rule) => {
        if (rule.adjustmentPercent <= 0) return false;

        if (rule.type === 'time_of_week') {
            return timeOfWeekRuleMatches(rule, show.showDateTime, timezone);
        }

        return false;
    });

    return !isPeak;
}