import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

const sendEmailMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../configs/nodeMailer.js', () => ({ default: (...args) => sendEmailMock(...args) }));

let Show, Booking, User, editShow, deleteShow;

beforeAll(async () => {
    await startTestDb();
    ({ default: Show } = await import('../models/Show.js'));
    ({ default: Booking } = await import('../models/Booking.js'));
    ({ default: User } = await import('../models/User.js'));
    ({ editShow, deleteShow } = await import('../controllers/showController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    sendEmailMock.mockClear();
});

const setUpShow = async (showOverrides = {}) => {
    const theater = await createTestTheater();
    const screen = await createTestScreen(theater._id);
    const movie = await createTestMovie();
    const show = await createTestShow(movie._id, screen._id, {
        showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        occupiedSeats: {},
        ...showOverrides,
    });
    return { theater, screen, movie, show };
};

const adminReq = ({ theaterId, showId, body = {} }) =>
    createMockReq({
        userId: 'theater-admin-1',
        adminContext: { role: 'theaterAdmin', theaterId: theaterId.toString() },
        params: { showId: showId.toString() },
        body,
    });

describe('editShow', () => {
    it('allows a price-only edit even with paid bookings', async () => {
        const { theater, show } = await setUpShow();
        await Booking.create({ user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });

        const result = await invokeController(editShow, adminReq({ theaterId: theater._id, showId: show._id, body: { showPrice: 350 } }));

        expect(result.statusCode).toBe(200);
        const updated = await Show.findById(show._id);
        expect(updated.showPrice).toBe(350);
    });

    it('blocks a showtime change when the show has paid bookings', async () => {
        const { theater, show } = await setUpShow();
        await Booking.create({ user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });

        const newTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const result = await invokeController(editShow, adminReq({ theaterId: theater._id, showId: show._id, body: { showDateTime: newTime } }));

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('SHOW_HAS_PAID_BOOKINGS');

        const unchanged = await Show.findById(show._id);
        expect(unchanged.showDateTime.toISOString()).not.toBe(newTime);
    });

    it('allows a showtime change with zero paid bookings, and invalidates pending unpaid bookings', async () => {
        const { theater, show } = await setUpShow({ occupiedSeats: { A1: 'user-a' } });
        await Booking.create({ user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: false, status: 'pending' });
        await User.create({ _id: 'user-a', name: 'Alice', email: 'alice@example.com', image: 'http://example.com/a.png' });

        const newTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const result = await invokeController(editShow, adminReq({ theaterId: theater._id, showId: show._id, body: { showDateTime: newTime } }));

        expect(result.statusCode).toBe(200);

        const updatedShow = await Show.findById(show._id);
        expect(new Date(updatedShow.showDateTime).toISOString()).toBe(newTime);
        expect(updatedShow.occupiedSeats.A1).toBeUndefined(); // seat released

        const remainingBookings = await Booking.find({ show: show._id.toString() });
        expect(remainingBookings).toHaveLength(0); // pending booking deleted

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(sendEmailMock.mock.calls[0][0].to).toBe('alice@example.com');
    });

    it('rejects a theaterAdmin editing a show at a different theater', async () => {
        const { show } = await setUpShow();
        const otherTheater = await createTestTheater({ name: 'INOX', slug: 'inox-mumbai', city: 'Mumbai', contactEmail: 'inox@example.com' });

        const result = await invokeController(editShow, adminReq({ theaterId: otherTheater._id, showId: show._id, body: { showPrice: 999 } }));

        expect(result.statusCode).toBe(403);
        expect(result.body.code).toBe('NOT_AUTHORIZED');
    });
});

describe('deleteShow', () => {
    it('soft-deletes a show with zero paid bookings', async () => {
        const { theater, show } = await setUpShow();

        const result = await invokeController(deleteShow, adminReq({ theaterId: theater._id, showId: show._id }));

        expect(result.statusCode).toBe(200);
        const updated = await Show.findById(show._id);
        expect(updated.isCancelled).toBe(true);
        // soft-delete: the document must still exist for historical booking queries
        expect(updated).not.toBeNull();
    });

    it('returns a 409 when the show has paid bookings', async () => {
        const { theater, show } = await setUpShow();
        await Booking.create({ user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: true, status: 'confirmed' });

        const result = await invokeController(deleteShow, adminReq({ theaterId: theater._id, showId: show._id }));

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('SHOW_HAS_PAID_BOOKINGS');

        const unchanged = await Show.findById(show._id);
        expect(unchanged.isCancelled).toBe(false);
    });

    it('releases seats and notifies users with pending unpaid bookings before cancelling', async () => {
        const { theater, show } = await setUpShow({ occupiedSeats: { A1: 'user-a' } });
        await Booking.create({ user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'], isPaid: false, status: 'pending' });
        await User.create({ _id: 'user-a', name: 'Alice', email: 'alice@example.com', image: 'http://example.com/a.png' });

        const result = await invokeController(deleteShow, adminReq({ theaterId: theater._id, showId: show._id }));

        expect(result.statusCode).toBe(200);

        const updatedShow = await Show.findById(show._id);
        expect(updatedShow.isCancelled).toBe(true);
        expect(updatedShow.occupiedSeats.A1).toBeUndefined();

        const remainingBookings = await Booking.find({ show: show._id.toString() });
        expect(remainingBookings).toHaveLength(0);
        expect(sendEmailMock).toHaveBeenCalledTimes(1);
    });
});
