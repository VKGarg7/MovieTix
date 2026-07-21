import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        city: {type: String, required: true},
        address: {type: String, required: true},
    } , {timestamps: true}
)

const Theater = mongoose.model('Theater', theaterSchema);

export default Theater;
