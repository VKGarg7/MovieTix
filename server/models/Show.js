import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie: {type: String, required: true , ref: 'Movie'},
        screen: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Screen'},
        showDateTime: {type: Date, required: true},
        showPrice: {type: Number, required: true},
        occupiedSeats: {type: Object, default: {}},
        isCancelled: {type: Boolean, default: false},
        isMysteryMovie: {type: Boolean, default: false},
        mysteryRevealAt: {type: String, enum: ['onBooking', 'atTheater'], default: 'onBooking'},
        // Present only for a Show born from an approved CommunityScreeningRequest
        // (MT-804). Additive/optional by design — every existing consumer of Show
        // (booking flow, browse filters, occupancy pulse, dashboard) has zero
        // awareness of these fields and must keep working unmodified by omission.
        communityHostId: {type: mongoose.Schema.Types.ObjectId, ref: 'CommunityHost', default: null},
        revenueSplitPercent: {type: Number, min: 0, max: 100, default: null},
    } , {minimize: false}
)

showSchema.index({ movie: 1, showDateTime: 1 });

const Show = mongoose.model('Show', showSchema);

export default Show;