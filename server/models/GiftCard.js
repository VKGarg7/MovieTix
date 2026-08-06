import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    purchaserId: { type: String, required: true, ref: 'User' },
    recipientEmail: { type: String, default: null, trim: true, lowercase: true },
    message: { type: String, default: '' },
    initialBalance: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    redeemedBy: { type: [String], ref: 'User', default: [] },
    status: { type: String, enum: ['active', 'depleted', 'expired'], default: 'active' },
}, { timestamps: true });

giftCardSchema.index({ purchaserId: 1, createdAt: -1 });

const GiftCard = mongoose.model('GiftCard', giftCardSchema);
export default GiftCard;
