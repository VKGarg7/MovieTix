import mongoose from "mongoose";

const candidateShowSchema = new mongoose.Schema({
    show: { type: String, required: true, ref: 'Show' },
    removed: { type: Boolean, default: false }, 
}, { _id: false });

const inviteeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    votedFor: { type: String, default: null }, 
}, { _id: false });

const showtimePollSchema = new mongoose.Schema({
    organizerId: { type: String, required: true, ref: 'User' },
    candidateShows: { type: [candidateShowSchema], required: true },
    invitees: { type: [inviteeSchema], default: [] },
    invitedCount: { type: Number, required: true },
    quorumCount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'closed', 'expired'], default: 'active' },
    winningShow: { type: String, ref: 'Show', default: null },
    resultingGroupBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupBooking', default: null },
    expiresAt: { type: Date, required: true },
    organizerNote: { type: String, default: '' },
}, { timestamps: true });

showtimePollSchema.index({ expiresAt: 1 });
showtimePollSchema.index({ organizerId: 1, createdAt: -1 });

const ShowtimePoll = mongoose.model('ShowtimePoll', showtimePollSchema);

export default ShowtimePoll;
