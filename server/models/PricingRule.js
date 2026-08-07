import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['time_of_week', 'early_bird', 'flash_seats'], required: true },
    adjustmentPercent: { type: Number, required: true, min: -100, max: 100 },
    theaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', default: null },
    isActive: { type: Boolean, default: true },

    daysOfWeek: { type: [Number], default: undefined },
    startHour: { type: Number, min: 0, max: 23, default: undefined },
    endHour: { type: Number, min: 1, max: 24, default: undefined },

    minDaysBeforeShow: { type: Number, min: 0, default: undefined },

    showId: { type: String, ref: 'Show', default: undefined },
    source: { type: String, enum: ['admin', 'system'], default: 'admin' },
}, { timestamps: true });

pricingRuleSchema.index({ theaterId: 1, isActive: 1 });
pricingRuleSchema.index({ showId: 1 }, { unique: true, sparse: true });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
export default PricingRule;
