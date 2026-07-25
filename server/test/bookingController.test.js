import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';
import { createMockReq, invokeController } from './helpers/mockReqRes.js';

// createBooking talks to real Stripe after reserving seats; mock it so tests
// don't need network access or real API keys, while the seat-reservation
// logic under test (Show.findOneAndUpdate) runs against the real in-memory DB.
vi.mock('stripe', () => {
    const checkoutSessionsCreate = vi.fn().mockResolvedValue({
        url: 'https://checkout.stripe.com/test-session',
    });
    // bookingController does `new stripe(...)`, so the mock constructor must
    // be a real function/class, not an arrow function (arrows can't be `new`ed).
    function MockStripe() {
        this.checkout = { sessions: { create: checkoutSessionsCreate } };
    }
    return { default: MockStripe };
});

vi.mock('../inngest/index.js', () => ({
    inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

let Show, Booking, Movie, Theater, Screen, createBooking;

beforeAll(async () => {
    await startTestDb();
    ({ default: Show } = await import('../models/Show.js'));
    ({ default: Booking } = await import('../models/Booking.js'));
    ({ default: Movie } = await import('../models/Movie.js'));
    ({ default: Theater } = await import('../models/Theater.js'));
    ({ default: Screen } = await import('../models/Screen.js'));
    ({ createBooking } = await import('../controllers/bookingController.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const createTestMovie = async (overrides = {}) => {
    return Movie.create({
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
        ...overrides,
    });
};

// Defaults match the old hardcoded A-J x 9 grid, so existing seat-id assertions
// (e.g. "J9" valid, "Z1"/"A0"/"A11" invalid) still hold against a real screen config.
const DEFAULT_ROWS = 'ABCDEFGHIJ'.split('').map((label) => ({ label, seatCount: 9, seatType: 'regular' }));

const createTestScreen = async (rows = DEFAULT_ROWS) => {
    const theater = await Theater.create({
        name: 'Test Theater',
        slug: 'test-theater-test-city',
        city: 'Test City',
        address: '123 Test St',
        geolocation: { lat: 0, lng: 0 },
        contactEmail: 'test-theater@example.com',
    });

    return Screen.create({
        theater: theater._id,
        name: 'Screen 1',
        rows,
    });
};

const createTestShow = async (overrides = {}, rows = DEFAULT_ROWS) => {
    const movie = await createTestMovie();
    const screen = await createTestScreen(rows);
    return Show.create({
        movie: movie._id,
        screen: screen._id,
        showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        showPrice: 200,
        occupiedSeats: {},
        ...overrides,
    });
};

const bookingReq = ({ userId, showId, selectedSeats }) =>
    createMockReq({
        userId,
        body: { showId, selectedSeats },
        headers: { origin: 'http://localhost:5173' },
    });

describe('createBooking — concurrent seat reservation', () => {
    it('only lets one of two concurrent requests for the same seat succeed', async () => {
        const show = await createTestShow();

        const reqA = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: ['A1'] });
        const reqB = bookingReq({ userId: 'user-b', showId: show._id.toString(), selectedSeats: ['A1'] });

        const [resultA, resultB] = await Promise.all([
            invokeController(createBooking, reqA),
            invokeController(createBooking, reqB),
        ]);

        const statusCodes = [resultA.statusCode, resultB.statusCode].sort();
        expect(statusCodes).toEqual([200, 409]);

        const successResult = resultA.statusCode === 200 ? resultA : resultB;
        const conflictResult = resultA.statusCode === 200 ? resultB : resultA;

        expect(successResult.body.success).toBe(true);
        expect(conflictResult.body.success).toBe(false);
        expect(conflictResult.body.code).toBe('SEATS_UNAVAILABLE');

        // exactly one booking document should have been created for this seat
        const bookings = await Booking.find({ show: show._id.toString() });
        expect(bookings).toHaveLength(1);
        expect(bookings[0].bookedSeats).toEqual(['A1']);

        const refreshedShow = await Show.findById(show._id);
        expect(Object.keys(refreshedShow.occupiedSeats)).toEqual(['A1']);
    });

    it('lets two concurrent requests for different seats both succeed', async () => {
        const show = await createTestShow();

        const reqA = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: ['A1'] });
        const reqB = bookingReq({ userId: 'user-b', showId: show._id.toString(), selectedSeats: ['A2'] });

        const [resultA, resultB] = await Promise.all([
            invokeController(createBooking, reqA),
            invokeController(createBooking, reqB),
        ]);

        expect(resultA.statusCode).toBe(200);
        expect(resultB.statusCode).toBe(200);

        const bookings = await Booking.find({ show: show._id.toString() });
        expect(bookings).toHaveLength(2);
    });

    it('returns 404 when the show does not exist', async () => {
        const req = bookingReq({ userId: 'user-a', showId: '000000000000000000000000', selectedSeats: ['A1'] });

        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(404);
        expect(result.body.code).toBe('SHOW_NOT_FOUND');
    });
});

describe('createBooking — seat count limit', () => {
    it('rejects more than 5 seats with a 400', async () => {
        const show = await createTestShow();
        const req = bookingReq({
            userId: 'user-a',
            showId: show._id.toString(),
            selectedSeats: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
        });

        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('TOO_MANY_SEATS');

        const bookings = await Booking.find({ show: show._id.toString() });
        expect(bookings).toHaveLength(0);
    });

    it('accepts exactly 5 seats', async () => {
        const show = await createTestShow();
        const req = bookingReq({
            userId: 'user-a',
            showId: show._id.toString(),
            selectedSeats: ['A1', 'A2', 'A3', 'A4', 'A5'],
        });

        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(200);
    });
});

describe('createBooking — seat ID validation', () => {
    it.each([
        ['lowercase letter', ['a1']],
        ['out-of-range row letter', ['Z1']],
        ['seat 0', ['A0']],
        ['no number', ['A']],
        ['extra characters', ['A11']],
        ['non-string seat', [1]],
    ])('rejects invalid seat id: %s', async (_label, selectedSeats) => {
        const show = await createTestShow();
        const req = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats });

        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('INVALID_SEATS');
    });

    it('accepts a valid seat id', async () => {
        const show = await createTestShow();
        const req = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: ['J9'] });

        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(200);
    });

    it('rejects missing showId or empty seat list with a 400', async () => {
        const show = await createTestShow();

        const noShowId = bookingReq({ userId: 'user-a', showId: undefined, selectedSeats: ['A1'] });
        const emptySeats = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: [] });

        const resultNoShowId = await invokeController(createBooking, noShowId);
        const resultEmptySeats = await invokeController(createBooking, emptySeats);

        expect(resultNoShowId.statusCode).toBe(400);
        expect(resultNoShowId.body.code).toBe('INVALID_INPUT');
        expect(resultEmptySeats.statusCode).toBe(400);
        expect(resultEmptySeats.body.code).toBe('INVALID_INPUT');
    });
});

describe('createBooking — validates against the show\'s actual screen config', () => {
    it('accepts a seat in a short premium row and rejects one past its seat count', async () => {
        // Proves validation isn't a relabeled 10x9 grid: row C only has 6 seats here,
        // so C6 is valid and C7 must be rejected even though "C" exists.
        const show = await createTestShow({}, [
            { label: 'A', seatCount: 9, seatType: 'regular' },
            { label: 'B', seatCount: 9, seatType: 'regular' },
            { label: 'C', seatCount: 6, seatType: 'premium' },
        ]);

        const validReq = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: ['C6'] });
        const validResult = await invokeController(createBooking, validReq);
        expect(validResult.statusCode).toBe(200);

        const invalidReq = bookingReq({ userId: 'user-b', showId: show._id.toString(), selectedSeats: ['C7'] });
        const invalidResult = await invokeController(createBooking, invalidReq);
        expect(invalidResult.statusCode).toBe(400);
        expect(invalidResult.body.code).toBe('INVALID_SEATS');
    });

    it('rejects a row letter that does not exist on this screen even if another screen has it', async () => {
        // A 3-row screen (A-C) shouldn't accept "J9", which was only valid under the old hardcoded grid.
        const show = await createTestShow({}, [
            { label: 'A', seatCount: 9, seatType: 'regular' },
            { label: 'B', seatCount: 9, seatType: 'regular' },
            { label: 'C', seatCount: 6, seatType: 'premium' },
        ]);

        const req = bookingReq({ userId: 'user-a', showId: show._id.toString(), selectedSeats: ['J9'] });
        const result = await invokeController(createBooking, req);

        expect(result.statusCode).toBe(400);
        expect(result.body.code).toBe('INVALID_SEATS');
    });
});
