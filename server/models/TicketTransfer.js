import mongoose from "mongoose";

const ticketTransferSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    show: { type: String, required: true, ref: 'Show' },
    sellerId: { type: String, required: true, ref: 'User' },
    mode: { type: String, enum: ['direct', 'resale'], required: true },
    recipientEmail: { type: String, default: null, trim: true, lowercase: true },
    originalPrice: { type: Number, required: true, min: 0 },
    resalePrice: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ['pending', 'claimed', 'cancelled', 'expired'], default: 'pending' },
    claimedBy: { type: String, ref: 'User', default: null },
    claimedAt: { type: Date, default: null },
}, { timestamps: true });

ticketTransferSchema.index({ sellerId: 1, createdAt: -1 });
ticketTransferSchema.index({ mode: 1, status: 1, show: 1 });
ticketTransferSchema.index(
    { booking: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

const TicketTransfer = mongoose.model('TicketTransfer', ticketTransferSchema);
export default TicketTransfer;
