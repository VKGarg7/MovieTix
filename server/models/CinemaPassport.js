import mongoose from "mongoose";

const stampSchema = new mongoose.Schema({
    theater: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theater' },
    firstVisitedAt: { type: Date, required: true },
}, { _id: false });

const cinemaPassportSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true, ref: 'User' },
    stamps: { type: [stampSchema], default: [] },
    milestonesReached: { type: [Number], default: [] },
}, { timestamps: true });

const CinemaPassport = mongoose.model('CinemaPassport', cinemaPassportSchema);

export default CinemaPassport;
