import mongoose from "mongoose";

const screenSchema = new mongoose.Schema(
    {
        theater: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theater'},
        name: {type: String, required: true},
        screenType: {type: String, default: 'Standard'},
        // seat layout: an array of rows, each with a letter label and a seat count
        // e.g. [{ row: 'A', seats: 9 }, { row: 'B', seats: 9 }, ...]
        rows: {
            type: [{ row: {type: String, required: true}, seats: {type: Number, required: true, min: 1, max: 30} }],
            required: true,
            validate: v => Array.isArray(v) && v.length > 0,
        },
    } , {timestamps: true}
)

const Screen = mongoose.model('Screen', screenSchema);

export default Screen;
