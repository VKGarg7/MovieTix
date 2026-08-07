import mongoose from "mongoose";

const candidateMovieSchema = new mongoose.Schema({
    movie: { type: String, required: true, ref: 'Movie' },
}, { _id: false });

const swipeSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    yes: { type: Boolean, required: true },
}, { _id: false });

const participantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    swipes: { type: [swipeSchema], default: [] },
}, { _id: false });

const matchSessionSchema = new mongoose.Schema({
    hostId: { type: String, required: true, ref: 'User' },
    theaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', default: null },
    candidateMovieIds: { type: [candidateMovieSchema], required: true },
    participants: { type: [participantSchema], default: [] },
    invitedCount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'closed', 'expired'], default: 'active' },
    matchedMovieId: { type: String, ref: 'Movie', default: null },
    resultingShowtimePollId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShowtimePoll', default: null },
    resultingGroupBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupBooking', default: null },
    expiresAt: { type: Date, required: true },
    organizerNote: { type: String, default: '' },
}, { timestamps: true });

matchSessionSchema.index({ expiresAt: 1 });
matchSessionSchema.index({ hostId: 1, createdAt: -1 });

const MatchSession = mongoose.model('MatchSession', matchSessionSchema);

export default MatchSession;
