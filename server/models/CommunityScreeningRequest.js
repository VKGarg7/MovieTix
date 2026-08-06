import mongoose from "mongoose";

const communityScreeningRequestSchema = new mongoose.Schema({
    theaterId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theater' },
    openSlotId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'OpenSlot' },
    requesterId: { type: String, required: true, ref: 'User' },
    filmTitle: { type: String, required: true, trim: true },
    filmDescription: { type: String, default: '' },
    filmRuntimeMinutes: { type: Number, required: true, min: 1 },
    expectedDraw: { type: Number, required: true, min: 0 },
    contactNote: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'withdrawn'], default: 'pending' },
    rejectionReason: { type: String, default: null },
    reviewedBy: { type: String, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', default: null },
}, { timestamps: true });

communityScreeningRequestSchema.index({ theaterId: 1, status: 1 });
communityScreeningRequestSchema.index({ requesterId: 1, createdAt: -1 });
communityScreeningRequestSchema.index(
    { openSlotId: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

const CommunityScreeningRequest = mongoose.model('CommunityScreeningRequest', communityScreeningRequestSchema);
export default CommunityScreeningRequest;
