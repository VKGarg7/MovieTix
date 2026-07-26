import mongoose from "mongoose";
import { IANAZone } from "luxon";

const theaterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
        city: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        timezone: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (tz) => IANAZone.isValidZone(tz),
                message: props => `${props.value} is not a valid IANA timezone`,
            },
        },
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
        cancellationPolicy: {
            cutoffHoursBeforeShow: { type: Number, default: 2, min: 0 },
        },
    },
    { timestamps: true }
);

theaterSchema.index({ name: 1, city: 1 }, { unique: true });

const Theater = mongoose.model('Theater', theaterSchema);

export default Theater;
