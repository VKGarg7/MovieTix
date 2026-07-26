import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater } from './helpers/factories.js';

let Screen, Show, Movie, createScreen, getScreens, updateScreen;

beforeAll(async () => {
    await startTestDb();
    ({ default: Screen } = await import('../models/Screen.js'));
    ({ default: Show } = await import('../models/Show.js'));
    ({ default: Movie } = await import('../models/Movie.js'));
    ({ createScreen, getScreens, updateScreen } = await import('../controllers/screenController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const mixedRows = [
    { label: 'A', seatCount: 9, seatType: 'regular' },
    { label: 'B', seatCount: 9, seatType: 'regular' },
    { label: 'C', seatCount: 6, seatType: 'premium' },
];

describe('createScreen', () => {
    it('creates a screen with mixed seat types and derives totalCapacity', async () => {
        const theater = await createTestTheater();
        const req = createMockReq({
            userId: 'admin-1',
            body: { theaterId: theater._id.toString(), name: 'Screen 1', rows: mixedRows },
        });

        const result = await invokeController(createScreen, req);

        expect(result.statusCode).toBe(201);
        expect(result.body.screen.totalCapacity).toBe(24);
        expect(result.body.screen.rows.map(r => r.seatType)).toEqual(['regular', 'regular', 'premium']);
    });

    it('rejects a missing theaterId', async () => {
        const req = createMockReq({ userId: 'admin-1', body: { name: 'Screen 1', rows: mixedRows } });

        const result = await invokeController(createScreen, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('INVALID_INPUT');
    });

    it('rejects a nonexistent theater', async () => {
        const req = createMockReq({
            userId: 'admin-1',
            body: { theaterId: '000000000000000000000000', name: 'Screen 1', rows: mixedRows },
        });

        const result = await invokeController(createScreen, req);

        expect(result.statusCode).toBe(404);
        expect(result.body.code).toBe('THEATER_NOT_FOUND');
    });

    it.each([
        ['duplicate row labels', [{ label: 'A', seatCount: 9 }, { label: 'A', seatCount: 5 }]],
        ['invalid seatCount', [{ label: 'A', seatCount: 0 }]],
        ['invalid seatType', [{ label: 'A', seatCount: 9, seatType: 'vip' }]],
        ['invalid row label', [{ label: 'AA', seatCount: 9 }]],
        ['empty rows', []],
    ])('rejects invalid rows: %s', async (_label, rows) => {
        const theater = await createTestTheater();
        const req = createMockReq({
            userId: 'admin-1',
            body: { theaterId: theater._id.toString(), name: 'Screen 1', rows },
        });

        const result = await invokeController(createScreen, req);

        expect(result.statusCode).toBe(400);
    });

    it('rejects a duplicate screen name within the same theater', async () => {
        const theater = await createTestTheater();
        await Screen.create({ theater: theater._id, name: 'Screen 1', rows: mixedRows });

        const req = createMockReq({
            userId: 'admin-1',
            body: { theaterId: theater._id.toString(), name: 'Screen 1', rows: mixedRows },
        });

        const result = await invokeController(createScreen, req);

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('DUPLICATE_KEY');
    });
});

describe('getScreens', () => {
    it('filters by theaterId', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });

        await Screen.create({ theater: theaterA._id, name: 'Screen 1', rows: mixedRows });
        await Screen.create({ theater: theaterB._id, name: 'Screen 1', rows: mixedRows });

        const req = createMockReq({ userId: 'admin-1', query: { theaterId: theaterA._id.toString() } });
        const result = await invokeController(getScreens, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.screens).toHaveLength(1);
    });
});

describe('updateScreen — edit policy', () => {
    it('blocks row edits when the screen has an upcoming show', async () => {
        const theater = await createTestTheater();
        const screen = await Screen.create({ theater: theater._id, name: 'Screen 1', rows: mixedRows });
        const movie = await Movie.create({
            _id: 'test-movie-1',
            title: 'Test Movie',
            overview: 'A movie for testing.',
            poster_path: '/test.jpg',
            backdrop_path: '/test-backdrop.jpg',
            release_date: '2026-01-01',
            genres: [{ id: 1, name: 'Test' }],
            casts: [{ name: 'Test Actor' }],
            vote_average: 7.5,
            runtime: 100,
        });
        await Show.create({
            movie: movie._id,
            screen: screen._id,
            showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            showPrice: 200,
        });

        const req = createMockReq({
            userId: 'admin-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            params: { screenId: screen._id.toString() },
            body: { rows: [{ label: 'A', seatCount: 5, seatType: 'regular' }] },
        });

        const result = await invokeController(updateScreen, req);

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('SCREEN_IN_USE');
    });

    it('allows row edits when there are no upcoming shows', async () => {
        const theater = await createTestTheater();
        const screen = await Screen.create({ theater: theater._id, name: 'Screen 1', rows: mixedRows });

        const req = createMockReq({
            userId: 'admin-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            params: { screenId: screen._id.toString() },
            body: { rows: [{ label: 'A', seatCount: 5, seatType: 'regular' }] },
        });

        const result = await invokeController(updateScreen, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.screen.totalCapacity).toBe(5);
    });

    it('allows renaming without touching rows even if shows exist', async () => {
        const theater = await createTestTheater();
        const screen = await Screen.create({ theater: theater._id, name: 'Screen 1', rows: mixedRows });
        const movie = await Movie.create({
            _id: 'test-movie-1',
            title: 'Test Movie',
            overview: 'A movie for testing.',
            poster_path: '/test.jpg',
            backdrop_path: '/test-backdrop.jpg',
            release_date: '2026-01-01',
            genres: [{ id: 1, name: 'Test' }],
            casts: [{ name: 'Test Actor' }],
            vote_average: 7.5,
            runtime: 100,
        });
        await Show.create({
            movie: movie._id,
            screen: screen._id,
            showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            showPrice: 200,
        });

        const req = createMockReq({
            userId: 'admin-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            params: { screenId: screen._id.toString() },
            body: { name: 'Screen 1 (Renamed)' },
        });

        const result = await invokeController(updateScreen, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.screen.name).toBe('Screen 1 (Renamed)');
    });

    it('rejects a theaterAdmin editing a screen belonging to a different theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screen = await Screen.create({ theater: theaterB._id, name: 'Screen 1', rows: mixedRows });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
            params: { screenId: screen._id.toString() },
            body: { name: 'Hijacked' },
        });

        const result = await invokeController(updateScreen, req);

        expect(result.statusCode).toBe(403);
        expect(result.body.code).toBe('NOT_AUTHORIZED');
    });

    it('allows a theaterAdmin to edit their own theater\'s screen', async () => {
        const theaterA = await createTestTheater();
        const screen = await Screen.create({ theater: theaterA._id, name: 'Screen 1', rows: mixedRows });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
            params: { screenId: screen._id.toString() },
            body: { name: 'Renamed by owner' },
        });

        const result = await invokeController(updateScreen, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.screen.name).toBe('Renamed by owner');
    });
});
