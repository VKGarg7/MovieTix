import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    theaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

menuItemSchema.index({ theaterId: 1, isAvailable: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
