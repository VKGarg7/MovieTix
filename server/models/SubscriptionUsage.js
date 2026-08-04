import mongoose from "mongoose";

const subscriptionUsageSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        subscription: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Subscription' },
        booking: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Booking' },
        show: { type: String, required: true, ref: 'Show' },
        creditsUsed: { type: Number, required: true, min: 1, default: 1 },
        billingPeriodStart: { type: Date, required: true },
        billingPeriodEnd: { type: Date, required: true },
    },
    { timestamps: true }
);

subscriptionUsageSchema.index({ user: 1, billingPeriodStart: 1 });
subscriptionUsageSchema.index({ subscription: 1, billingPeriodStart: 1 });
subscriptionUsageSchema.index({ booking: 1 }, { unique: true });

const SubscriptionUsage = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
export default SubscriptionUsage;