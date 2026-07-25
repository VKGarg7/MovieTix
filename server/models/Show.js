import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie: {type: String, required: true , ref: 'Movie'},
        screen: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Screen'},
        showDateTime: {type: Date, required: true},
        showPrice: {type: Number, required: true},
        occupiedSeats: {type: Object, default: {}},
    } , {minimize: false}
)

// getShows/getShow filter and sort on showDateTime; addShow filters by movie.
// Compound index covers both the "all upcoming shows" and "upcoming shows for movie X" queries.
showSchema.index({ movie: 1, showDateTime: 1 });

const Show = mongoose.model('Show', showSchema);

export default Show;