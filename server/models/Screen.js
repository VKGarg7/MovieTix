import mongoose from "mongoose";

const SEAT_TYPES = ['regular', 'premium', 'recliner', 'accessible'];

const rowSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, uppercase: true, match: /^[A-Z]$/ },
        seatCount: { type: Number, required: true, min: 1, max: 50 },
        seatType: { type: String, required: true, enum: SEAT_TYPES, default: 'regular' },
    },
    { _id: false }
);

const screenSchema = new mongoose.Schema(
    {
        theater: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theater' },
        name: { type: String, required: true, trim: true },
        rows: {
            type: [rowSchema],
            required: true,
            validate: {
                validator: (rows) => Array.isArray(rows) && rows.length > 0,
                message: 'A screen must have at least one row',
            },
        },
        totalCapacity: { type: Number, required: true, min: 1 },
    },
    { timestamps: true }
);

// Same screen name can't repeat within a theater (e.g. two "Screen 1"s).
screenSchema.index({ theater: 1, name: 1 }, { unique: true });

screenSchema.pre('validate', function computeTotalCapacity(next) {
    if (Array.isArray(this.rows)) {
        const labels = this.rows.map(r => r.label);
        if (new Set(labels).size !== labels.length) {
            return next(new Error('Row labels must be unique within a screen'));
        }
        this.totalCapacity = this.rows.reduce((sum, row) => sum + row.seatCount, 0);
    }
    next();
});

export const SEAT_TYPE_VALUES = SEAT_TYPES;
const Screen = mongoose.model('Screen', screenSchema);

export default Screen;
