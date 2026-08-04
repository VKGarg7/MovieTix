import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User', unique: true },
        stripeCustomerId: { type: String, required: true },
        stripeSubscriptionId: { type: String, required: true },
        status: {
            type: String,
            enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing'],
            default: 'active',
        },
        plan: {
            type: String,
            enum: ['binge_pass_monthly'],
            default: 'binge_pass_monthly',
        },
        creditsPerCycle: { type: Number, default: 4 },
        creditsRemaining: { type: Number, default: 4 },
        currentPeriodStart: { type: Date, required: true },
        currentPeriodEnd: { type: Date, required: true },
        cancelAtPeriodEnd: { type: Boolean, default: false },
    },
    { timestamps: true }
);

subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;