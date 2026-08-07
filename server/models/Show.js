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
        isRelaxedScreening: {type: Boolean, default: false},
        accommodations: {type: [String], default: []},
        communityHostId: {type: mongoose.Schema.Types.ObjectId, ref: 'CommunityHost', default: null},
        revenueSplitPercent: {type: Number, min: 0, max: 100, default: null},

        isLiveEvent: {type: Boolean, default: false},
        liveEventId: {type: mongoose.Schema.Types.ObjectId, default: null},
        simulcastStartTime: {type: Date, default: null},
        combinedRuntimeMinutes: {type: Number, min: 1, default: null},
    } , {minimize: false}
)

showSchema.index({ movie: 1, showDateTime: 1 });
showSchema.index({ liveEventId: 1 }, { sparse: true });

const Show = mongoose.model('Show', showSchema);

export default Show;