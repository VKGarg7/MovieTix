import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';

let Theater, createTheater, getTheaters;

beforeAll(async () => {
    await startTestDb();
    ({ default: Theater } = await import('../models/Theater.js'));
    ({ createTheater, getTheaters } = await import('../controllers/theaterController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const validTheater = (overrides = {}) => ({
    name: 'PVR',
    city: 'Noida',
    address: 'DLF Mall of India, Sector 18',
    geolocation: { lat: 28.5677, lng: 77.3219 },
    contactEmail: 'pvr.noida@example.com',
    ...overrides,
});

describe('createTheater', () => {
    it('creates a theater with a slugified name', async () => {
        const req = createMockReq({ userId: 'admin-1', body: validTheater() });

        const result = await invokeController(createTheater, req);

        expect(result.statusCode).toBe(201);
        expect(result.body.theater.slug).toBe('pvr-noida');
        expect(result.body.theater.city).toBe('Noida');
    });

    it('rejects missing required fields', async () => {
        const req = createMockReq({ userId: 'admin-1', body: validTheater({ name: undefined }) });

        const result = await invokeController(createTheater, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('INVALID_INPUT');
    });

    it.each([
        ['non-numeric lat/lng', { lat: 'north', lng: 77.3219 }],
        ['lat out of range', { lat: 999, lng: 77.3219 }],
        ['lng out of range', { lat: 28.5677, lng: -999 }],
    ])('rejects invalid geolocation: %s', async (_label, geolocation) => {
        const req = createMockReq({ userId: 'admin-1', body: validTheater({ geolocation }) });

        const result = await invokeController(createTheater, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('INVALID_GEOLOCATION');
    });

    it('rejects a duplicate theater name in the same city', async () => {
        await Theater.create({ ...validTheater(), slug: 'pvr' });

        const req = createMockReq({ userId: 'admin-1', body: validTheater() });
        const result = await invokeController(createTheater, req);

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('DUPLICATE_KEY');
    });

    it('allows the same theater name in a different city', async () => {
        await Theater.create({ ...validTheater(), slug: 'pvr' });

        const req = createMockReq({
            userId: 'admin-1',
            body: validTheater({ city: 'Mumbai', contactEmail: 'pvr.mumbai@example.com' }),
        });
        const result = await invokeController(createTheater, req);

        expect(result.statusCode).toBe(201);
    });
});

describe('getTheaters', () => {
    beforeEach(async () => {
        await Theater.create([
            { ...validTheater(), slug: 'pvr' },
            { ...validTheater({ name: 'INOX', city: 'Mumbai', contactEmail: 'inox.mumbai@example.com' }), slug: 'inox' },
        ]);
    });

    it('lists all theaters when no city filter is given', async () => {
        const req = createMockReq({ userId: 'admin-1' });
        const result = await invokeController(getTheaters, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.theaters).toHaveLength(2);
    });

    it('filters by city case-insensitively', async () => {
        const req = createMockReq({ userId: 'admin-1', query: { city: 'noida' } });
        const result = await invokeController(getTheaters, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.theaters).toHaveLength(1);
        expect(result.body.theaters[0].city).toBe('Noida');
    });
});
