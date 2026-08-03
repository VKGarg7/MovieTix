import crypto from 'crypto';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import PointsTransaction from '../models/PointsTransaction.js';

const CODE_LENGTH = 8;
const REFERRER_REWARD_POINTS = 100;
const REFEREE_REWARD_POINTS = 50;

const generateCode = () => crypto.randomBytes(6).toString('base64url').slice(0, CODE_LENGTH).toUpperCase();

export const assignReferralCode = async (userId) => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const code = generateCode();
            await User.updateOne({ _id: userId }, { referralCode: code });
            return code;
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }
    throw new Error(`Failed to assign a unique referral code to user ${userId} after 5 attempts`);
};

export const attributeReferral = async (refereeId, referralCode) => {
    if (!referralCode) return;

    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer || referrer._id === refereeId) return;

    await User.updateOne({ _id: refereeId }, { referredBy: referrer._id });
    await Referral.updateOne(
        { referee: refereeId },
        { referrer: referrer._id, referee: refereeId },
        { upsert: true }
    );
};

export const grantReferralRewardIfEligible = async (refereeId) => {
    const referral = await Referral.findOneAndUpdate(
        { referee: refereeId, rewardGranted: false },
        { $set: { rewardGranted: true, rewardedAt: new Date() } },
        { new: true }
    );
    if (!referral) return;

    await PointsTransaction.create([
        { user: referral.referrer, delta: REFERRER_REWARD_POINTS, reason: 'earned', booking: null },
        { user: referral.referee, delta: REFEREE_REWARD_POINTS, reason: 'earned', booking: null },
    ]);
};
