import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        movie: { type: String, required: true, ref: 'Movie' },
    },
    { timestamps: true }
);

followSchema.index({ user: 1, movie: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;
