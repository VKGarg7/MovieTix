import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema({
    userId: {type: String, required: true, ref: 'User'},
    showId: {type: String, required: true, ref: 'Show'},
    joinedAt: {type: Date, default: Date.now},
    status: {type: String, enum: ['waiting', 'offered', 'claimed', 'expired', 'left'], default: 'waiting'},
    offeredSeat: {type: String, default: null},
    offeredAt: {type: Date, default: null},
    offerExpiresAt: {type: Date, default: null},
    bookingId: {type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null},
} , {timestamps: true});

waitlistSchema.index(
    { showId: 1, userId: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ['waiting', 'offered'] } } }
);

waitlistSchema.index({ showId: 1, status: 1, joinedAt: 1 });

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;
