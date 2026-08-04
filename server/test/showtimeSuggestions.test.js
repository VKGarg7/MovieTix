import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

vi.mock('../utils/tmdbClient.js', () => ({
    default: { get: vi.fn().mockRejectedValue(new Error('should not be called when movie is local')) },
}));

let suggestShowtimes, getShowtimeSuggestions;

beforeAll(async () => {
    await startTestDb();
    ({ suggestShowtimes } = await import('../controllers/showController.js'));
    ({ getShowtimeSuggestions } = await import('../utils/showtimeSuggestions.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const fridayNight = new Date('2026-01-16T14:00:00Z');

describe('getShowtimeSuggestions', () => {
    it('falls back to fixed defaults when the theater has no show history at all', async () => {
        const theaterA = await createTestTheater();

        const suggestions = await getShowtimeSuggestions({
            theaterId: theaterA._id,
            genreNames: ['Action'],
            timezone: 'Asia/Kolkata',
        });

        expect(suggestions.length).toBeGreaterThanOrEqual(2);
        expect(suggestions.every(s => s.basis === 'default')).toBe(true);
    });

    it('prefers genre-matched history when at least 2 buckets exist', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id, { rows: [{ label: 'A', seatCount: 10, seatType: 'regular' }] });
        const actionMovie = await createTestMovie('action-1', { genres: [{ id: 28, name: 'Action' }] });
        const dramaMovie = await createTestMovie('drama-1', { genres: [{ id: 18, name: 'Drama' }] });

        await createTestShow(actionMovie._id, screenA._id, {
            showDateTime: fridayNight,
            occupiedSeats: { A1: 'u', A2: 'u', A3: 'u', A4: 'u', A5: 'u', A6: 'u', A7: 'u', A8: 'u' },
        });
        await createTestShow(actionMovie._id, screenA._id, {
            showDateTime: new Date('2026-01-17T08:30:00Z'),
            occupiedSeats: { A1: 'u', A2: 'u', A3: 'u', A4: 'u', A5: 'u', A6: 'u', A7: 'u' },
        });
        await createTestShow(dramaMovie._id, screenA._id, {
            showDateTime: new Date('2026-01-14T04:00:00Z'),
            occupiedSeats: { A1: 'u' },
        });

        const suggestions = await getShowtimeSuggestions({
            theaterId: theaterA._id,
            genreNames: ['Action'],
            timezone: 'Asia/Kolkata',
        });

        expect(suggestions[0].basis).toBe('genre-history');
        expect(suggestions[0].dayLabel).toBe('Friday');
        expect(suggestions[0].avgOccupancyPct).toBeGreaterThan(70);
    });

    it('falls back to theater-wide history when the genre has no history at this theater', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id, { rows: [{ label: 'A', seatCount: 10, seatType: 'regular' }] });
        const comedyMovie = await createTestMovie('comedy-1', { genres: [{ id: 35, name: 'Comedy' }] });

        await createTestShow(comedyMovie._id, screenA._id, {
            showDateTime: fridayNight,
            occupiedSeats: { A1: 'u', A2: 'u' },
        });
        await createTestShow(comedyMovie._id, screenA._id, {
            showDateTime: new Date('2026-01-14T04:00:00Z'),
            occupiedSeats: { A1: 'u' },
        });

        const suggestions = await getShowtimeSuggestions({
            theaterId: theaterA._id,
            genreNames: ['Horror'],
            timezone: 'Asia/Kolkata',
        });

        expect(suggestions.length).toBeGreaterThanOrEqual(2);
        expect(suggestions.some(s => s.basis === 'theater-history')).toBe(true);
    });
});

describe('suggestShowtimes controller', () => {
    it('returns suggestions scoped to the screen\'s theater, and rejects a theaterAdmin from a different theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie();

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
            query: { movieId: movie._id, screenId: screenB._id.toString() },
        });

        const result = await invokeController(suggestShowtimes, req);

        expect(result.statusCode).toBe(403);
    });

    it('returns at least 2 suggestions for a valid request', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();

        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: { movieId: movie._id, screenId: screenA._id.toString() },
        });

        const result = await invokeController(suggestShowtimes, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.suggestions.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects a request missing movieId or screenId', async () => {
        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: {},
        });

        const result = await invokeController(suggestShowtimes, req);

        expect(result.statusCode).toBe(400);
    });
});
