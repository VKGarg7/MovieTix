import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        movie: { type: String, required: true, ref: 'Movie' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        text: { type: String, default: '' },
    },
    { timestamps: true }
);

reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
