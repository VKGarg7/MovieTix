import mongoose from "mongoose";

const openSlotSchema = new mongoose.Schema({
    theaterId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theater' },
    screen: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Screen' },
    proposedDateTime: { type: Date, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    revenueSplitPercent: { type: Number, required: true, min: 0, max: 100, default: 70 }, // host's share
    notes: { type: String, default: '' },
    status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },
    filledByRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityScreeningRequest', default: null },
    createdBy: { type: String, required: true, ref: 'User' },
}, { timestamps: true });

openSlotSchema.index({ theaterId: 1, status: 1 });
openSlotSchema.index({ screen: 1, proposedDateTime: 1 });

const OpenSlot = mongoose.model('OpenSlot', openSlotSchema);
export default OpenSlot;
