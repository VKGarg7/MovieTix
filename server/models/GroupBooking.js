import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
    seat: {type: String, required: true},
    userId: {type: String, ref: 'User', default: null},
    bookingId: {type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null},
    isPaid: {type: Boolean, default: false},
    claimedAt: {type: Date, default: null},
}, {_id: false});

const groupBookingSchema = new mongoose.Schema({
    organizerId: {type: String, required: true, ref: 'User'},
    show: {type: String, required: true, ref: 'Show'},
    seatBlock: {type: [String], required: true},
    claims: {type: [claimSchema], default: []},
    expiresAt: {type: Date, required: true},
    status: {type: String, enum: ['active', 'expired', 'cancelled', 'completed'], default: 'active'},
    organizerNote: {type: String, default: ''},
} , {timestamps: true});

groupBookingSchema.index({ expiresAt: 1 });
groupBookingSchema.index({ organizerId: 1, createdAt: -1 });

const GroupBooking = mongoose.model('GroupBooking', groupBookingSchema);

export default GroupBooking;
