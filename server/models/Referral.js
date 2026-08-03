import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
    referrer: { type: String, ref: 'User', required: true },
    referee: { type: String, ref: 'User', required: true, unique: true },
    rewardGranted: { type: Boolean, default: false },
    rewardedAt: { type: Date, default: null },
}, { timestamps: true });

const Referral = mongoose.model('Referral', referralSchema);
export default Referral;
