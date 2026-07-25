import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie } from './helpers/factories.js';

vi.mock('../inngest/index.js', () => ({
    inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

let addShow;

beforeAll(async () => {
    await startTestDb();
    ({ addShow } = await import('../controllers/showController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const addShowReq = ({ userId, adminContext, body }) =>
    createMockReq({ userId, adminContext, body });

describe('addShow — theater scoping', () => {
    it('rejects a theaterAdmin adding a show to a screen at a different theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie();

        const req = addShowReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
            body: {
                movieId: movie._id,
                screenId: screenB._id.toString(),
                showsInput: [{ date: '2026-08-01', time: ['14:00'] }],
                showPrice: 250,
            },
        });

        const result = await invokeController(addShow, req);

        expect(result.statusCode).toBe(403);
        expect(result.body.code).toBe('NOT_AUTHORIZED');
    });

    it('allows a theaterAdmin to add a show to their own theater\'s screen', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();

        const req = addShowReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
            body: {
                movieId: movie._id,
                screenId: screenA._id.toString(),
                showsInput: [{ date: '2026-08-01', time: ['14:00'] }],
                showPrice: 250,
            },
        });

        const result = await invokeController(addShow, req);

        expect(result.statusCode).toBe(200);
    });

    it('allows a superAdmin to add a show to any theater\'s screen', async () => {
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie();

        const req = addShowReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            body: {
                movieId: movie._id,
                screenId: screenB._id.toString(),
                showsInput: [{ date: '2026-08-01', time: ['14:00'] }],
                showPrice: 250,
            },
        });

        const result = await invokeController(addShow, req);

        expect(result.statusCode).toBe(200);
    });
});
