import Theater from '../models/Theater.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import slugify from '../utils/slugify.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// API to create a theater (super-admin only)
export const createTheater = asyncHandler(async (req, res) => {
    const { name, city, address, geolocation, contactEmail, isActive } = req.body;

    if (!name || !city || !address || !contactEmail) {
        throw new AppError('name, city, address and contactEmail are required', 400, 'INVALID_INPUT');
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
        geolocation: { lat, lng },
        contactEmail,
        isActive: isActive ?? true,
    });

    res.status(201).json({ success: true, theater });
});

// API to list theaters, optionally filtered by city
export const getTheaters = asyncHandler(async (req, res) => {
    const { city } = req.query;
    const filter = city ? { city: new RegExp(`^${escapeRegex(city)}$`, 'i') } : {};

    const theaters = await Theater.find(filter).sort({ city: 1, name: 1 });
    res.json({ success: true, theaters });
});
