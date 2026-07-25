import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/testDb.js';

let Show, Screen, Movie, Theater, runMigration;

beforeAll(async () => {
    await startTestDb();
    ({ default: Show } = await import('../models/Show.js'));
    ({ default: Screen } = await import('../models/Screen.js'));
    ({ default: Movie } = await import('../models/Movie.js'));
    ({ default: Theater } = await import('../models/Theater.js'));
    ({ runMigration } = await import('../scripts/migrateShowsToScreen.js'));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

const createTestMovie = async () => Movie.create({
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

// Bypasses Mongoose's required-field validation to insert shows the way they
// would have existed before Show.screen was introduced.
const insertLegacyShow = async (movieId, occupiedSeats = {}) => {
    const result = await Show.collection.insertOne({
        movie: movieId,
        showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        showPrice: 200,
        occupiedSeats,
    });
    return result.insertedId;
};

describe('migrateShowsToScreen', () => {
    it('is a no-op when every show already has a screen', async () => {
        const movie = await createTestMovie();
        const theater = await Theater.create({
            name: 'T', slug: 't-c', city: 'C', address: 'A',
            geolocation: { lat: 0, lng: 0 }, contactEmail: 'a@example.com',
        });
        const screen = await Screen.create({
            theater: theater._id,
            name: 'Screen 1',
            rows: [{ label: 'A', seatCount: 9, seatType: 'regular' }],
        });
        await Show.create({ movie: movie._id, screen: screen._id, showDateTime: new Date(), showPrice: 200 });

        const result = await runMigration();

        expect(result.migratedCount).toBe(0);
        expect(result.flaggedForReview).toEqual([]);
        expect(result.totalShowsBefore).toBe(result.totalShowsAfter);
    });

    it('backfills a legacy screen onto shows missing one, preserving the row count', async () => {
        const movie = await createTestMovie();
        await insertLegacyShow(movie._id, { A1: 'user-1' });
        await insertLegacyShow(movie._id, {});

        const result = await runMigration();

        expect(result.totalShowsBefore).toBe(2);
        expect(result.totalShowsAfter).toBe(2);
        expect(result.migratedCount).toBe(2);
        expect(result.flaggedForReview).toEqual([]);

        const shows = await Show.find({});
        for (const show of shows) {
            expect(show.screen).toBeTruthy();
        }

        const stillMissing = await Show.countDocuments({ screen: { $exists: false } });
        expect(stillMissing).toBe(0);
    });

    it('flags shows whose occupiedSeats do not fit the legacy layout instead of dropping them', async () => {
        const movie = await createTestMovie();
        const cleanShowId = await insertLegacyShow(movie._id, { A1: 'user-1' });
        const badRowShowId = await insertLegacyShow(movie._id, { Z9: 'user-2' });
        const badSeatNumberShowId = await insertLegacyShow(movie._id, { A10: 'user-3' });

        const result = await runMigration();

        expect(result.migratedCount).toBe(1);
        expect(result.flaggedForReview).toHaveLength(2);
        const flaggedIds = result.flaggedForReview.map(f => f.showId).sort();
        expect(flaggedIds).toEqual([badRowShowId.toString(), badSeatNumberShowId.toString()].sort());

        const cleanShow = await Show.findById(cleanShowId);
        expect(cleanShow.screen).toBeTruthy();

        const badRowShow = await Show.findById(badRowShowId);
        expect(badRowShow.screen).toBeFalsy();

        const badSeatNumberShow = await Show.findById(badSeatNumberShowId);
        expect(badSeatNumberShow.screen).toBeFalsy();

        // row count must never change, even when some shows are skipped
        expect(result.totalShowsBefore).toBe(result.totalShowsAfter);
    });

    it('is idempotent: running twice does not re-process already-migrated shows or duplicate the legacy screen', async () => {
        const movie = await createTestMovie();
        await insertLegacyShow(movie._id, { A1: 'user-1' });

        const firstRun = await runMigration();
        const secondRun = await runMigration();

        expect(firstRun.migratedCount).toBe(1);
        expect(secondRun.migratedCount).toBe(0);

        const legacyScreens = await Screen.find({ name: 'Legacy Screen' });
        expect(legacyScreens).toHaveLength(1);
    });
});
