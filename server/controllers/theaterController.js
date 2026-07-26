import { IANAZone } from 'luxon';
import Theater from '../models/Theater.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import slugify from '../utils/slugify.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createTheater = asyncHandler(async (req, res) => {
    const { name, city, address, geolocation, contactEmail, isActive, timezone } = req.body;

    if (!name || !city || !address || !contactEmail || !timezone) {
        throw new AppError('name, city, address, contactEmail and timezone are required', 400, 'INVALID_INPUT');
    }
    if (!IANAZone.isValidZone(timezone)) {
        throw new AppError('timezone must be a valid IANA zone name (e.g. "Asia/Kolkata")', 400, 'INVALID_TIMEZONE');
    }

    const lat = geolocation?.lat;
    const lng = geolocation?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new AppError('geolocation.lat and geolocation.lng must be numbers', 400, 'INVALID_GEOLOCATION');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('geolocation.lat/lng out of range', 400, 'INVALID_GEOLOCATION');
    }

    const theater = await Theater.create({
        name,
        slug: slugify(`${name}-${city}`),
        city,
        address,
        timezone,
        geolocation: { lat, lng },
        contactEmail,
        isActive: isActive ?? true,
    });

    res.status(201).json({ success: true, theater });
});

export const getTheaters = asyncHandler(async (req, res) => {
    const { city } = req.query;
    const filter = city ? { city: new RegExp(`^${escapeRegex(city)}$`, 'i') } : {};

    const theaters = await Theater.find(filter).sort({ city: 1, name: 1 });
    res.json({ success: true, theaters });
});
