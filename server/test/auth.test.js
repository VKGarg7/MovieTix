import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';

const getUserMock = vi.fn();

vi.mock('@clerk/express', () => ({
    clerkClient: { users: { getUser: (...args) => getUserMock(...args) } },
}));

let Theater, protectAdmin, requireSuperAdmin;

beforeAll(async () => {
    await startTestDb();
    ({ default: Theater } = await import('../models/Theater.js'));
    ({ protectAdmin, requireSuperAdmin } = await import('../middleware/auth.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    getUserMock.mockReset();
});

const createTestTheater = async (overrides = {}) => Theater.create({
    name: 'PVR',
    slug: 'pvr-noida',
    city: 'Noida',
    address: 'DLF Mall of India',
    timezone: 'Asia/Kolkata',
    geolocation: { lat: 28.5677, lng: 77.3219 },
    contactEmail: 'pvr.noida@example.com',
    isActive: true,
    ...overrides,
});

const runMiddleware = async (middleware, req) => {
    let forwardedError = null;
    const next = (err) => { if (err) forwardedError = err; };
    await middleware(req, {}, next);
    return forwardedError;
};

const mockReq = (userId = 'user-1') => ({
    auth: () => ({ userId }),
    log: { warn: vi.fn(), error: vi.fn() },
});

describe('protectAdmin', () => {
    it('rejects a user with no admin role', async () => {
        getUserMock.mockResolvedValue({ privateMetadata: {} });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
        expect(req.adminContext).toBeUndefined();
    });

    it('rejects an unrecognized role string', async () => {
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'editor' } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });

    it('lets a superAdmin through with no theaterId restriction', async () => {
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'superAdmin' } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeNull();
        expect(req.adminContext).toEqual({ role: 'superAdmin', theaterId: null });
    });

    it('lets a theaterAdmin through with their theaterId attached', async () => {
        const theater = await createTestTheater();
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'theaterAdmin', theaterId: theater._id.toString() } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeNull();
        expect(req.adminContext).toEqual({ role: 'theaterAdmin', theaterId: theater._id.toString() });
    });

    it('rejects a theaterAdmin with no theaterId assigned', async () => {
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'theaterAdmin' } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });

    it('rejects a theaterAdmin whose theaterId does not exist (deleted theater)', async () => {
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'theaterAdmin', theaterId: '000000000000000000000000' } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });

    it('rejects a theaterAdmin whose theater is deactivated, without throwing', async () => {
        const theater = await createTestTheater({ isActive: false, name: 'Inactive', slug: 'inactive-noida' });
        getUserMock.mockResolvedValue({ privateMetadata: { role: 'theaterAdmin', theaterId: theater._id.toString() } });
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });

    it('denies gracefully (403, not a throw) when the Clerk lookup itself fails', async () => {
        getUserMock.mockRejectedValue(new Error('Clerk API down'));
        const req = mockReq();

        const err = await runMiddleware(protectAdmin, req);

        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });
});

describe('requireSuperAdmin', () => {
    it('allows a superAdmin through', async () => {
        const req = { adminContext: { role: 'superAdmin', theaterId: null } };
        const err = await runMiddleware(requireSuperAdmin, req);
        expect(err).toBeNull();
    });

    it('rejects a theaterAdmin', async () => {
        const req = { adminContext: { role: 'theaterAdmin', theaterId: 'abc' } };
        const err = await runMiddleware(requireSuperAdmin, req);
        expect(err).toBeTruthy();
        expect(err.statusCode).toBe(403);
    });
});
