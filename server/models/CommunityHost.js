import mongoose from "mongoose";

const communityHostSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, ref: 'User' },
    organizationName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    eligible: { type: Boolean, default: true },
    verifiedBy: { type: String, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    revokedBy: { type: String, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
}, { timestamps: true });

const CommunityHost = mongoose.model('CommunityHost', communityHostSchema);
export default CommunityHost;
