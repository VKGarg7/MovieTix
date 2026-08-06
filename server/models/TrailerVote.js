import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    choice: { type: String, required: true },
}, { _id: false });

const trailerVoteSchema = new mongoose.Schema({
    show: { type: String, required: true, unique: true, ref: 'Show' },
    candidateMovieIds: {
        type: [String],
        required: true,
        validate: { validator: (arr) => arr.length >= 2 && arr.length <= 3, message: 'candidateMovieIds must have 2 or 3 entries' },
    },
    votes: { type: [voteSchema], default: [] },
}, { timestamps: true });

const TrailerVote = mongoose.model('TrailerVote', trailerVoteSchema);
export default TrailerVote;
