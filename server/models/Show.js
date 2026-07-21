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

const Show = mongoose.model('Show', showSchema);

export default Show;