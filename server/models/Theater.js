import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
        city: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        geolocation: {
            lat: { type: Number, min: -90, max: 90, required: true },
            lng: { type: Number, min: -180, max: 180, required: true },
        },
        contactEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid contact email'],
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Same theater name can exist in different cities, but not twice in the same city.
theaterSchema.index({ name: 1, city: 1 }, { unique: true });

const Theater = mongoose.model('Theater', theaterSchema);

export default Theater;
