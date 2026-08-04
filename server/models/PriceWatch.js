import mongoose from "mongoose";

const priceWatchSchema = new mongoose.Schema({
    user: { type: String, required: true, ref: 'User' },
    show: { type: String, required: true, ref: 'Show' },
    priceAtWatchTime: { type: Number, required: true },
    lastNotifiedPrice: { type: Number, default: null },
    lastNotifiedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'cleared'], default: 'active' },
}, { timestamps: true });

priceWatchSchema.index({ user: 1, show: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
priceWatchSchema.index({ status: 1 });

const PriceWatch = mongoose.model('PriceWatch', priceWatchSchema);

export default PriceWatch;
