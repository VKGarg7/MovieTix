import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {type: String, required: true, ref: 'User'},
    show: {type: String, required: true, ref: 'Show'},
    amount: {type: Number, required: true},
    originalAmount: {type: Number},
    couponCode: {type: String, default: null},
    discountAmount: {type: Number, default: 0},
    pointsRedeemed: {type: Number, default: 0},
    pointsDiscountAmount: {type: Number, default: 0},
    bookedSeats: {type: Array, required: true},
    snacks: {type: [{
        menuItem: {type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true},
        name: {type: String, required: true},
        price: {type: Number, required: true},
        quantity: {type: Number, required: true, min: 1},
    }], default: []},
    snacksAmount: {type: Number, default: 0},
    concessionPickedUp: {type: Boolean, default: false},
    isPaid: {type: Boolean, default: false},
    paymentLink: {type: String},
    paymentIntentId: {type: String},
    status: {type: String, enum: ['pending', 'confirmed', 'cancelled', 'pending-cancellation'], default: 'pending'},
    groupBookingId: {type: mongoose.Schema.Types.ObjectId, ref: 'GroupBooking', default: null},
    groupBookingSeats: {type: [String], default: []},
    waitlistEntryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Waitlist', default: null},
    postCreditsAlertSent: {type: Boolean, default: false},
    bingePassCreditUsed: {type: Boolean, default: false},
    bingePassCreditAmount: {type: Number, default: 0},
} , {timestamps: true});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;