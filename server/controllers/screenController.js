import mongoose from 'mongoose';
import Screen from '../models/Screen.js';
import Theater from '../models/Theater.js';
import Show from '../models/Show.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { assertScreenBelongsToTheater } from '../utils/theaterScope.js';
import { recordAudit } from '../utils/auditLog.js';

const SEAT_TYPES = ['regular', 'premium', 'recliner', 'accessible'];

const validateRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        return 'rows must be a non-empty array';
    }

    const seenLabels = new Set();
    for (const row of rows) {
        const { label, seatCount, seatType } = row || {};

        if (typeof label !== 'string' || !/^[A-Za-z]$/.test(label)) {
            return `Invalid row label: ${label}`;
        }
        const upperLabel = label.toUpperCase();
        if (seenLabels.has(upperLabel)) {
            return `Duplicate row label: ${upperLabel}`;
        }
        seenLabels.add(upperLabel);

        if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 50) {
            return `Invalid seatCount for row ${upperLabel}: must be an integer between 1 and 50`;
        }

        if (seatType !== undefined && !SEAT_TYPES.includes(seatType)) {
            return `Invalid seatType for row ${upperLabel}: must be one of ${SEAT_TYPES.join(', ')}`;
        }
    }

    return null;
};

const VIEW_FROM_SEAT_BANDS = ['front', 'middle', 'back'];

const validateViewFromSeat = (viewFromSeat) => {
    if (viewFromSeat === undefined) return null;
    if (typeof viewFromSeat !== 'object' || viewFromSeat === null || Array.isArray(viewFromSeat)) {
        return 'viewFromSeat must be an object';
    }
    for (const band of Object.keys(viewFromSeat)) {
        if (!VIEW_FROM_SEAT_BANDS.includes(band)) {
            return `Invalid viewFromSeat band: ${band}. Must be one of ${VIEW_FROM_SEAT_BANDS.join(', ')}`;
        }
        const value = viewFromSeat[band];
        if (value !== null && (typeof value !== 'string' || !value.trim())) {
            return `viewFromSeat.${band} must be a non-empty URL string or null`;
        }
    }
    return null;
};

const normalizeViewFromSeat = (viewFromSeat) => Object.fromEntries(
    VIEW_FROM_SEAT_BANDS.map(band => [band, viewFromSeat?.[band]?.trim() || null])
);

export const createScreen = asyncHandler(async (req, res) => {
    const { theaterId, name, rows, viewFromSeat } = req.body;

    if (!theaterId || !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('A valid theaterId is required', 400, 'INVALID_INPUT');
    }
    if (!name) {
        throw new AppError('name is required', 400, 'INVALID_INPUT');
    }

    const rowsError = validateRows(rows);
    if (rowsError) {
        throw new AppError(rowsError, 400, 'INVALID_ROWS');
    }
    const viewFromSeatError = validateViewFromSeat(viewFromSeat);
    if (viewFromSeatError) {
        throw new AppError(viewFromSeatError, 400, 'INVALID_VIEW_FROM_SEAT');
    }

    const theater = await Theater.findById(theaterId);
    if (!theater) {
        throw new AppError('Theater not found', 404, 'THEATER_NOT_FOUND');
    }

    const normalizedRows = rows.map(row => ({
        label: row.label.toUpperCase(),
        seatCount: row.seatCount,
        seatType: row.seatType || 'regular',
    }));

    const screen = await Screen.create({
        theater: theaterId,
        name,
        rows: normalizedRows,
        viewFromSeat: normalizeViewFromSeat(viewFromSeat),
    });

    await recordAudit({
        req,
        action: 'create',
        entityType: 'Screen',
        entityId: screen._id,
        diff: { after: screen.toObject() },
    });

    res.status(201).json({ success: true, screen });
});

export const getScreens = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    const filter = theaterId ? { theater: theaterId } : {};
    const screens = await Screen.find(filter).populate('theater').sort({ name: 1 });

    res.json({ success: true, screens });
});

export const updateScreen = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    const { name, rows, viewFromSeat } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen) {
        throw new AppError('Screen not found', 404, 'SCREEN_NOT_FOUND');
    }

    assertScreenBelongsToTheater(screen, req.adminContext);

    if (rows !== undefined) {
        const hasUpcomingShows = await Show.exists({ screen: screenId, showDateTime: { $gte: new Date() } });
        if (hasUpcomingShows) {
            throw new AppError(
                'Cannot edit seat layout: this screen has upcoming shows. Cancel or reassign them first.',
                409,
                'SCREEN_IN_USE'
            );
        }

        const rowsError = validateRows(rows);
        if (rowsError) {
            throw new AppError(rowsError, 400, 'INVALID_ROWS');
        }

        screen.rows = rows.map(row => ({
            label: row.label.toUpperCase(),
            seatCount: row.seatCount,
            seatType: row.seatType || 'regular',
        }));
    }

    if (name !== undefined) {
        screen.name = name;
    }

    if (viewFromSeat !== undefined) {
        const viewFromSeatError = validateViewFromSeat(viewFromSeat);
        if (viewFromSeatError) {
            throw new AppError(viewFromSeatError, 400, 'INVALID_VIEW_FROM_SEAT');
        }
        const existing = screen.viewFromSeat?.toObject ? screen.viewFromSeat.toObject() : (screen.viewFromSeat || {});
        screen.viewFromSeat = normalizeViewFromSeat({ ...existing, ...viewFromSeat });
    }

    await screen.save();

    res.json({ success: true, screen });
});
