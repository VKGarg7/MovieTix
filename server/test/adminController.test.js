import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

let Booking, User;
let isAdmin, getDashboardData, getAllShows, getAllBookings;

beforeAll(async () => {
    await startTestDb();
    ({ default: Booking } = await import('../models/Booking.js'));
    ({ default: User } = await import('../models/User.js'));
    ({ isAdmin, getDashboardData, getAllShows, getAllBookings } = await import('../controllers/adminController.js'));
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
