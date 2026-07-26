import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';
import { createTestTheater, createTestScreen, createTestMovie, createTestShow } from './helpers/factories.js';

const refundsCreate = vi.fn();
vi.mock('stripe', () => {
    function MockStripe() {
        this.refunds = { create: (...args) => refundsCreate(...args) };
    }
    return { default: MockStripe };
});

let Show, Booking, cancelBooking;

beforeAll(async () => {
    await startTestDb();
    ({ default: Show } = await import('../models/Show.js'));
    ({ default: Booking } = await import('../models/Booking.js'));
    ({ cancelBooking } = await import('../controllers/bookingController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    refundsCreate.mockReset();
});


const createPaidBooking = async ({ showOverrides = {}, bookingOverrides = {} } = {}) => {
    const theater = await createTestTheater();
    const screen = await createTestScreen(theater._id);
    const movie = await createTestMovie();
    const show = await createTestShow(movie._id, screen._id, {
        showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        occupiedSeats: { A1: 'user-a' },
        ...showOverrides,
    });
    const booking = await Booking.create({
        user: 'user-a',
        show: show._id.toString(),
        amount: 200,
        bookedSeats: ['A1'],
        isPaid: true,
        status: 'confirmed',
        paymentIntentId: 'pi_test_123',
        ...bookingOverrides,
    });
    return { theater, screen, movie, show, booking };
};

const cancelReq = ({ userId, bookingId }) =>
    createMockReq({ userId, params: { bookingId } });

describe('cancelBooking', () => {
    it('cancels a paid booking, refunds via Stripe, and releases the seat', async () => {
        refundsCreate.mockResolvedValue({ id: 're_test_1' });
        const { show, booking } = await createPaidBooking();

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(200);
        expect(result.body.success).toBe(true);
        expect(refundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test_123' });

        const updatedBooking = await Booking.findById(booking._id);
        expect(updatedBooking.status).toBe('cancelled');
        expect(updatedBooking.isPaid).toBe(false);

        const updatedShow = await Show.findById(show._id);
        expect(Object.keys(updatedShow.occupiedSeats)).not.toContain('A1');
    });

    it('rejects cancelling someone else\'s booking with a 404 (no ownership leak)', async () => {
        const { booking } = await createPaidBooking();

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'someone-else', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(404);
        expect(result.body.code).toBe('BOOKING_NOT_FOUND');
        expect(refundsCreate).not.toHaveBeenCalled();
    });

    it('rejects cancelling within the theater\'s cancellation window', async () => {
        const { booking } = await createPaidBooking({
            showOverrides: { showDateTime: new Date(Date.now() + 60 * 60 * 1000) }, // 1h out, cutoff is 2h
        });

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('CANCELLATION_WINDOW_PASSED');
        expect(refundsCreate).not.toHaveBeenCalled();

        const updatedBooking = await Booking.findById(booking._id);
        expect(updatedBooking.status).toBe('confirmed');
    });

    it('rejects cancelling an already-cancelled booking', async () => {
        const { booking } = await createPaidBooking({ bookingOverrides: { status: 'cancelled', isPaid: false } });

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('ALREADY_CANCELLED');
    });

    it('rejects cancelling an unpaid booking', async () => {
        const { booking } = await createPaidBooking({ bookingOverrides: { isPaid: false, status: 'pending', paymentIntentId: undefined } });

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('BOOKING_NOT_PAID');
    });

    it('re-occupies the seat and marks pending-cancellation when the Stripe refund fails, instead of leaving an inconsistent state', async () => {
        refundsCreate.mockRejectedValue(Object.assign(new Error('card issuer declined refund'), { type: 'StripeError' }));
        const { show, booking } = await createPaidBooking();

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(502);
        expect(result.body.code).toBe('STRIPE_ERROR');

        const updatedBooking = await Booking.findById(booking._id);
        expect(updatedBooking.status).toBe('pending-cancellation');
        expect(updatedBooking.isPaid).toBe(true);

        const updatedShow = await Show.findById(show._id);
        expect(updatedShow.occupiedSeats.A1).toBe('user-a');
    });

    it('rejects cancelling a booking that is already pending-cancellation', async () => {
        const { booking } = await createPaidBooking({ bookingOverrides: { status: 'pending-cancellation' } });

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(409);
        expect(result.body.code).toBe('CANCELLATION_PENDING');
        expect(refundsCreate).not.toHaveBeenCalled();
    });

    it('honors a theater-specific cancellation cutoff instead of the 2-hour default', async () => {
        refundsCreate.mockResolvedValue({ id: 're_test_2' });
        const theater = await createTestTheater({ name: 'Strict Cinema', slug: 'strict-cinema', contactEmail: 'strict@example.com', cancellationPolicy: { cutoffHoursBeforeShow: 6 } });
        const screen = await createTestScreen(theater._id);
        const movie = await createTestMovie();
        const show = await createTestShow(movie._id, screen._id, {
            showDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
            occupiedSeats: { A1: 'user-a' },
        });
        const booking = await Booking.create({
            user: 'user-a', show: show._id.toString(), amount: 200, bookedSeats: ['A1'],
            isPaid: true, status: 'confirmed', paymentIntentId: 'pi_test_456',
        });

        const result = await invokeController(cancelBooking, cancelReq({ userId: 'user-a', bookingId: booking._id.toString() }));

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('CANCELLATION_WINDOW_PASSED');
    });
});
