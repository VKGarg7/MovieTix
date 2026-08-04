import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

let Booking, User;
let isAdmin, getDashboardData, getAllShows, getAllBookings, getDashboardAnalytics, exportBookingsCsv;

beforeAll(async () => {
    await startTestDb();
    ({ default: Booking } = await import('../models/Booking.js'));
    ({ default: User } = await import('../models/User.js'));
    ({ isAdmin, getDashboardData, getAllShows, getAllBookings, getDashboardAnalytics, exportBookingsCsv } = await import('../controllers/adminController.js'));
});

const invokeStreamingController = (controller, req) => new Promise((resolve, reject) => {
    const headers = {};
    let body = '';
    const res = {
        setHeader: (name, value) => { headers[name] = value; },
        write: (chunk) => { body += chunk; },
        end: () => resolve({ headers, body }),
    };
    const next = (err) => reject(err);
    controller(req, res, next).catch(reject);
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe('isAdmin', () => {
    it('returns the caller\'s specific role, not just a boolean', () => {
        const req = createMockReq({ userId: 'u1', adminContext: { role: 'theaterAdmin', theaterId: 'abc' } });
        const res = { json: (payload) => { res.body = payload; } };
        isAdmin(req, res);
        expect(res.body).toEqual({ success: true, isAdmin: true, role: 'theaterAdmin' });
    });
});

describe('getAllShows — theater scoping', () => {
    it('a superAdmin sees shows across all theaters', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        await createTestShow(movie._id, screenA._id);
        await createTestShow(movie._id, screenB._id);

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getAllShows, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.shows).toHaveLength(2);
    });

    it('a theaterAdmin only sees shows for their own theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id);
        await createTestShow(movie._id, screenB._id);

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
        });
        const result = await invokeController(getAllShows, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.shows).toHaveLength(1);
        expect(result.body.shows[0]._id.toString()).toBe(showA._id.toString());
    });
});

describe('getAllBookings — theater scoping', () => {
    it('a theaterAdmin only sees bookings for shows at their own theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id);
        const showB = await createTestShow(movie._id, screenB._id);

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: true });
        await Booking.create({ user: 'user-2', show: showB._id.toString(), amount: 200, bookedSeats: ['A2'], isPaid: true });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
        });
        const result = await invokeController(getAllBookings, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.bookings).toHaveLength(1);
        expect(result.body.bookings[0].show._id.toString()).toBe(showA._id.toString());
    });

    it('a superAdmin sees bookings across all theaters', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id);
        const showB = await createTestShow(movie._id, screenB._id);

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: true });
        await Booking.create({ user: 'user-2', show: showB._id.toString(), amount: 200, bookedSeats: ['A2'], isPaid: true });

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getAllBookings, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.bookings).toHaveLength(2);
    });
});

describe('getDashboardData — theater scoping', () => {
    it('a theaterAdmin only sees their own theater\'s shows/bookings, and no platform-wide user count', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id);
        const showB = await createTestShow(movie._id, screenB._id);

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 300, bookedSeats: ['A1'], isPaid: true });
        await Booking.create({ user: 'user-2', show: showB._id.toString(), amount: 500, bookedSeats: ['A2'], isPaid: true });
        await User.create({ _id: 'user-1', email: 'a@example.com', name: 'A', image: 'x' });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
        });
        const result = await invokeController(getDashboardData, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.dashboardData.totalBookings).toBe(1);
        expect(result.body.dashboardData.totalRevenue).toBe(300);
        expect(result.body.dashboardData.activeShows).toHaveLength(1);
        expect(result.body.dashboardData.totalUser).toBeNull();
    });

    it('a superAdmin sees platform-wide totals', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id);

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 300, bookedSeats: ['A1'], isPaid: true });
        await User.create({ _id: 'user-1', email: 'a@example.com', name: 'A', image: 'x' });

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getDashboardData, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.dashboardData.totalUser).toBe(1);
    });

    it('returns zeroed stats instead of throwing when there are no paid bookings', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie('m1');
        await createTestShow(movie._id, screenA._id);

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getDashboardData, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.dashboardData.totalBookings).toBe(0);
        expect(result.body.dashboardData.totalRevenue).toBe(0);
    });

    it('caps the activeShows preview but reports the true count separately', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie('m1');

        for (let i = 0; i < 15; i++) {
            await createTestShow(movie._id, screenA._id, { showDateTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000) });
        }

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getDashboardData, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.dashboardData.activeShowsCount).toBe(15);
        expect(result.body.dashboardData.activeShows).toHaveLength(12);
    });
});

describe('getDashboardAnalytics', () => {
    it('computes revenue trend, top movies, and occupancy via aggregation', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id, { rows: [{ label: 'A', seatCount: 10, seatType: 'regular' }] });
        const movie = await createTestMovie('m1');
        const show = await createTestShow(movie._id, screenA._id, {
            showDateTime: new Date(),
            occupiedSeats: { A1: 'user-1', A2: 'user-1' },
        });

        await Booking.create({
            user: 'user-1', show: show._id.toString(), amount: 400,
            bookedSeats: ['A1', 'A2'], isPaid: true, status: 'confirmed',
        });

        const req = createMockReq({ userId: 'super-1', adminContext: { role: 'superAdmin', theaterId: null } });
        const result = await invokeController(getDashboardAnalytics, req);

        expect(result.statusCode).toBe(200);
        const { revenueTrend, topMovies, occupancyByShow } = result.body.analytics;

        expect(revenueTrend).toHaveLength(1);
        expect(revenueTrend[0].revenue).toBe(400);
        expect(revenueTrend[0].bookings).toBe(1);

        expect(topMovies).toHaveLength(1);
        expect(topMovies[0].revenue).toBe(400);
        expect(topMovies[0].title).toBe('Movie m1');

        expect(occupancyByShow).toHaveLength(1);
        expect(occupancyByShow[0].occupiedCount).toBe(2);
        expect(occupancyByShow[0].totalCapacity).toBe(10);
        expect(occupancyByShow[0].occupancyPct).toBe(20);
    });

    it('returns empty arrays, not an error, for a date range with zero bookings', async () => {
        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: { from: '2000-01-01', to: '2000-01-02' },
        });
        const result = await invokeController(getDashboardAnalytics, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.analytics.revenueTrend).toEqual([]);
        expect(result.body.analytics.topMovies).toEqual([]);
        expect(result.body.analytics.occupancyByShow).toEqual([]);
    });

    it('a theaterAdmin only sees analytics for their own theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id, { showDateTime: new Date() });
        const showB = await createTestShow(movie._id, screenB._id, { showDateTime: new Date() });

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 100, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });
        await Booking.create({ user: 'user-1', show: showB._id.toString(), amount: 900, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
        });
        const result = await invokeController(getDashboardAnalytics, req);

        expect(result.statusCode).toBe(200);
        expect(result.body.analytics.revenueTrend[0].revenue).toBe(100);
        expect(result.body.analytics.occupancyByShow).toHaveLength(1);
    });

    it('rejects an invalid date range where "from" is after "to"', async () => {
        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: { from: '2026-01-10', to: '2026-01-01' },
        });
        const result = await invokeController(getDashboardAnalytics, req);

        expect(result.statusCode).toBe(400);
    });
});

describe('exportBookingsCsv', () => {
    it('streams a CSV with a header row and one row per booking, properly escaping special characters', async () => {
        const theaterA = await createTestTheater();
        const screenA = await createTestScreen(theaterA._id);
        const movie = await createTestMovie('m1', { title: 'Comma, "Quote" Movie' });
        const show = await createTestShow(movie._id, screenA._id, { showDateTime: new Date('2026-01-15T10:00:00Z') });
        await User.create({ _id: 'user-1', email: 'a@example.com', name: 'A, B', image: 'x' });

        await Booking.create({
            user: 'user-1', show: show._id.toString(), amount: 400,
            bookedSeats: ['A1', 'A2'], isPaid: true, status: 'confirmed',
            createdAt: new Date('2026-01-15T11:00:00Z'),
        });

        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: { from: '2026-01-01', to: '2026-01-31' },
        });
        const result = await invokeStreamingController(exportBookingsCsv, req);

        expect(result.headers['Content-Type']).toContain('text/csv');
        expect(result.headers['Content-Disposition']).toContain('attachment');

        const lines = result.body.trim().split('\r\n');
        expect(lines[0]).toBe('Booking ID,User Name,User Email,Movie,Show Time,Seats,Amount,Payment Status,Booked At');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain('"A, B"');
        expect(lines[1]).toContain('"Comma, ""Quote"" Movie"');
        expect(lines[1]).toContain('A1, A2');
        expect(lines[1]).toContain('400');
        expect(lines[1]).toContain('confirmed');
    });

    it('exports only a header row for a date range with zero bookings', async () => {
        const req = createMockReq({
            userId: 'super-1',
            adminContext: { role: 'superAdmin', theaterId: null },
            query: { from: '2000-01-01', to: '2000-01-02' },
        });
        const result = await invokeStreamingController(exportBookingsCsv, req);

        const lines = result.body.trim().split('\r\n');
        expect(lines).toHaveLength(1);
    });

    it('a theaterAdmin only exports bookings for their own theater', async () => {
        const theaterA = await createTestTheater();
        const theaterB = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });
        const screenA = await createTestScreen(theaterA._id);
        const screenB = await createTestScreen(theaterB._id);
        const movie = await createTestMovie('m1');
        const showA = await createTestShow(movie._id, screenA._id, { showDateTime: new Date() });
        const showB = await createTestShow(movie._id, screenB._id, { showDateTime: new Date() });
        await User.create({ _id: 'user-1', email: 'a@example.com', name: 'A', image: 'x' });

        await Booking.create({ user: 'user-1', show: showA._id.toString(), amount: 100, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });
        await Booking.create({ user: 'user-1', show: showB._id.toString(), amount: 900, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });

        const req = createMockReq({
            userId: 'theater-admin-1',
            adminContext: { role: 'theaterAdmin', theaterId: theaterA._id.toString() },
        });
        const result = await invokeStreamingController(exportBookingsCsv, req);

        const lines = result.body.trim().split('\r\n');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain('100');
    });
});
