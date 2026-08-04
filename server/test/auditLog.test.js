import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

vi.mock('../inngest/index.js', () => ({
    inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

let AuditLog, addShow, editShow, deleteShow, createTheater, createScreen, getAuditLog;

beforeAll(async () => {
    await startTestDb();
    ({ default: AuditLog } = await import('../models/AuditLog.js'));
    ({ addShow, editShow, deleteShow } = await import('../controllers/showController.js'));
    ({ createTheater } = await import('../controllers/theaterController.js'));
    ({ createScreen } = await import('../controllers/screenController.js'));
    ({ getAuditLog } = await import('../controllers/adminController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const superAdminReq = (overrides = {}) => createMockReq({
    userId: 'super-1',
    adminContext: { role: 'superAdmin', theaterId: null },
    ...overrides,
});

describe('audit logging on mutations', () => {
    it('records one entry for a bulk addShow, not one per show', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();

        const req = superAdminReq({
            body: {
                movieId: movie._id,
                screenId: screenA._id.toString(),
                showsInput: [{ date: '2026-08-01', time: ['14:00', '18:00', '21:00'] }],
                showPrice: 250,
            },
        });

        const result = await invokeController(addShow, req);
        expect(result.statusCode).toBe(200);

        const entries = await AuditLog.find({ entityType: 'Show', action: 'create' });
        expect(entries).toHaveLength(1);
        expect(entries[0].actorId).toBe('super-1');
        expect(entries[0].actorRole).toBe('superAdmin');
        expect(entries[0].diff.after.showsCreated).toBe(3);
        expect(entries[0].diff.after.showIds).toHaveLength(3);
    });

    it('records a before/after diff on editShow', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();
        const show = await createTestShow(movie._id, screenA._id, { showPrice: 200 });

        const req = superAdminReq({
            params: { showId: show._id.toString() },
            body: { showPrice: 300 },
        });

        const result = await invokeController(editShow, req);
        expect(result.statusCode).toBe(200);

        const entries = await AuditLog.find({ entityType: 'Show', action: 'update' });
        expect(entries).toHaveLength(1);
        expect(entries[0].entityId).toBe(show._id.toString());
        expect(entries[0].diff.before.showPrice).toBe(200);
        expect(entries[0].diff.after.showPrice).toBe(300);
    });

    it('records a delete entry on deleteShow (soft-cancel)', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();
        const show = await createTestShow(movie._id, screenA._id);

        const req = superAdminReq({ params: { showId: show._id.toString() } });

        const result = await invokeController(deleteShow, req);
        expect(result.statusCode).toBe(200);

        const entries = await AuditLog.find({ entityType: 'Show', action: 'delete' });
        expect(entries).toHaveLength(1);
        expect(entries[0].diff.after.isCancelled).toBe(true);
    });

    it('records a create entry on createTheater', async () => {
        const req = superAdminReq({
            body: {
                name: 'PVR', city: 'Noida', address: 'DLF Mall',
                contactEmail: 'pvr@example.com', timezone: 'Asia/Kolkata',
                geolocation: { lat: 28.5, lng: 77.3 },
            },
        });

        const result = await invokeController(createTheater, req);
        expect(result.statusCode).toBe(201);

        const entries = await AuditLog.find({ entityType: 'Theater', action: 'create' });
        expect(entries).toHaveLength(1);
        expect(entries[0].diff.after.name).toBe('PVR');
    });

    it('records a create entry on createScreen', async () => {
        const theaterA = await createTestTheater();

        const req = superAdminReq({
            body: {
                theaterId: theaterA._id.toString(),
                name: 'Screen 1',
                rows: [{ label: 'A', seatCount: 10, seatType: 'regular' }],
            },
        });

        const result = await invokeController(createScreen, req);
        expect(result.statusCode).toBe(201);

        const entries = await AuditLog.find({ entityType: 'Screen', action: 'create' });
        expect(entries).toHaveLength(1);
        expect(entries[0].diff.after.name).toBe('Screen 1');
    });

    it('does not break the mutation if audit recording fails', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie();
        const show = await createTestShow(movie._id, screenA._id);

        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: undefined, theaterId: null },
            params: { showId: show._id.toString() },
            body: { showPrice: 999 },
        });

        const result = await invokeController(editShow, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.show.showPrice).toBe(999);
        expect(await AuditLog.countDocuments()).toBe(0);
    });
});

describe('getAuditLog', () => {
    beforeEach(async () => {
        await AuditLog.create([
            { actorId: 'admin-1', actorRole: 'superAdmin', action: 'create', entityType: 'Theater', entityId: 't1', diff: {}, createdAt: new Date('2026-01-05') },
            { actorId: 'admin-2', actorRole: 'theaterAdmin', action: 'update', entityType: 'Show', entityId: 's1', diff: {}, createdAt: new Date('2026-01-10') },
            { actorId: 'admin-1', actorRole: 'superAdmin', action: 'delete', entityType: 'Show', entityId: 's2', diff: {}, createdAt: new Date('2026-01-15') },
        ]);
    });

    it('lists all entries newest-first by default', async () => {
        const req = superAdminReq();
        const result = await invokeController(getAuditLog, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.entries).toHaveLength(3);
        expect(result.body.entries[0].entityId).toBe('s2');
    });

    it('filters by actorId', async () => {
        const req = superAdminReq({ query: { actorId: 'admin-2' } });
        const result = await invokeController(getAuditLog, req);

        expect(result.body.entries).toHaveLength(1);
        expect(result.body.entries[0].actorId).toBe('admin-2');
    });

    it('filters by entityType', async () => {
        const req = superAdminReq({ query: { entityType: 'Theater' } });
        const result = await invokeController(getAuditLog, req);

        expect(result.body.entries).toHaveLength(1);
        expect(result.body.entries[0].entityType).toBe('Theater');
    });

    it('filters by date range', async () => {
        const req = superAdminReq({ query: { from: '2026-01-08', to: '2026-01-12' } });
        const result = await invokeController(getAuditLog, req);

        expect(result.body.entries).toHaveLength(1);
        expect(result.body.entries[0].entityId).toBe('s1');
    });

    it('includes entries created later on the same "to" day, not just before midnight', async () => {
        await AuditLog.create({
            actorId: 'admin-3', actorRole: 'superAdmin', action: 'create', entityType: 'Theater',
            entityId: 't2', diff: {}, createdAt: new Date('2026-01-12T18:30:00Z'),
        });

        const req = superAdminReq({ query: { from: '2026-01-12', to: '2026-01-12' } });
        const result = await invokeController(getAuditLog, req);

        expect(result.body.entries.map(e => e.entityId)).toContain('t2');
    });

    it('rejects an invalid entityType', async () => {
        const req = superAdminReq({ query: { entityType: 'Bogus' } });
        const result = await invokeController(getAuditLog, req);

        expect(result.statusCode).toBe(400);
    });
});
