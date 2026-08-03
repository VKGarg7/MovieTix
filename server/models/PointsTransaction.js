import mongoose from "mongoose";

const pointsTransactionSchema = new mongoose.Schema({
    user: { type: String, required: true, ref: 'User' },
    delta: { type: Number, required: true },
    reason: {
        type: String,
        enum: ['earned', 'redeemed', 'refunded_redemption', 'reversed_earning'],
        required: true,
    },
    booking: { type: String, ref: 'Booking', default: null },
}, { timestamps: true });

pointsTransactionSchema.index({ user: 1, createdAt: -1 });
pointsTransactionSchema.index({ booking: 1, reason: 1 });

const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
export default PointsTransaction;
