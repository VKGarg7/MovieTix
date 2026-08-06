import mongoose from "mongoose";

export const EMOTIONAL_TAGS = ['moved', 'thrilled', 'meh', 'haunted', 'inspired', 'laughed', 'bored'];

const emotionalPulseSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    movieId: { type: String, required: true, ref: 'Movie' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Booking', unique: true },
    tag: { type: String, required: true, enum: EMOTIONAL_TAGS },
}, { timestamps: true });

emotionalPulseSchema.index({ movieId: 1, tag: 1 });

const EmotionalPulse = mongoose.model('EmotionalPulse', emotionalPulseSchema);
export default EmotionalPulse;
