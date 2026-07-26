// One-time migration (MT-103): backfills Show.screen on every pre-existing
// show that predates the Screen model, pointing them at a default
// "Legacy Screen" so no data is lost.
//
// Idempotent: shows that already have a screen are left untouched, and the
// Legacy Theater/Screen are upserted by name, so re-running this script is safe.
//
// Usage: node scripts/migrateShowsToScreen.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import Show from '../models/Show.js';
import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import { findSeatsOutsideLayout } from '../utils/seatId.js';

const LEGACY_THEATER_NAME = 'Legacy Theater';
const LEGACY_THEATER_CITY = 'Unknown';
const LEGACY_SCREEN_NAME = 'Legacy Screen';

// Matches the app's original hardcoded 10x9 grid (rows A-J, 9 seats each,
// all regular), since that's the layout every pre-existing show was actually
// booked against before screens existed.
const LEGACY_ROWS = 'ABCDEFGHIJ'.split('').map((label) => ({
    label,
    seatCount: 9,
    seatType: 'regular',
}));

async function ensureLegacyScreen() {
    const theater = await Theater.findOneAndUpdate(
        { name: LEGACY_THEATER_NAME, city: LEGACY_THEATER_CITY },
        {
            name: LEGACY_THEATER_NAME,
            slug: 'legacy-theater-unknown',
            city: LEGACY_THEATER_CITY,
            address: 'Unknown (pre-dates theater/screen tracking)',
            geolocation: { lat: 0, lng: 0 },
            contactEmail: 'legacy@example.com',
            isActive: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // findOneAndUpdate skips pre('validate') hooks, so totalCapacity wouldn't
    // be derived on insert — upsert via find-then-save instead.
    let screen = await Screen.findOne({ theater: theater._id, name: LEGACY_SCREEN_NAME });
    if (!screen) {
        screen = new Screen({ theater: theater._id, name: LEGACY_SCREEN_NAME });
    }
    screen.rows = LEGACY_ROWS;
    await screen.save();

    return screen;
}

// Runs the migration against whatever DB mongoose is already connected to.
// Exported separately from the CLI entrypoint below so it can be exercised
// directly in tests against an in-memory DB.
export async function runMigration() {
    const totalShowsBefore = await Show.countDocuments();
    const showsMissingScreen = await Show.find({ screen: { $exists: false } });

    console.log(`Total shows: ${totalShowsBefore}`);
    console.log(`Shows missing a screen: ${showsMissingScreen.length}`);

    if (showsMissingScreen.length === 0) {
        console.log('Nothing to migrate — every show already has a screen.');
        return { totalShowsBefore, totalShowsAfter: totalShowsBefore, migratedCount: 0, flaggedForReview: [] };
    }

    const legacyScreen = await ensureLegacyScreen();
    console.log(`Legacy screen ready: ${legacyScreen.name} (${legacyScreen.totalCapacity} seats), id=${legacyScreen._id}`);

    const flaggedForReview = [];
    let migratedCount = 0;

    for (const show of showsMissingScreen) {
        const seatsOutsideLayout = findSeatsOutsideLayout(Object.keys(show.occupiedSeats || {}), legacyScreen);

        if (seatsOutsideLayout.length > 0) {
            // Don't silently drop or overwrite occupied-seat data that doesn't
            // fit the legacy layout — flag it for manual review instead.
            flaggedForReview.push({ showId: show._id.toString(), seatsOutsideLayout });
            console.warn(
                `FLAGGED show ${show._id}: occupiedSeats [${seatsOutsideLayout.join(', ')}] ` +
                `do not fit the legacy screen layout (rows A-J, 9 seats each). Skipped — needs manual review.`
            );
            continue;
        }

        show.screen = legacyScreen._id;
        await show.save();
        migratedCount++;
    }

    const totalShowsAfter = await Show.countDocuments();
    const stillMissingScreen = await Show.countDocuments({ screen: { $exists: false } });

    console.log('--- Migration summary ---');
    console.log(`Row count before: ${totalShowsBefore}`);
    console.log(`Row count after:  ${totalShowsAfter}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Flagged for manual review: ${flaggedForReview.length}`);
    console.log(`Still missing a screen: ${stillMissingScreen}`);

    if (totalShowsBefore !== totalShowsAfter) {
        console.error('ROW COUNT MISMATCH — migration must not change the number of Show documents. Investigate before trusting this run.');
    }

    if (flaggedForReview.length > 0) {
        console.warn('Shows flagged for manual review (occupiedSeats did not fit the legacy layout):');
        console.warn(JSON.stringify(flaggedForReview, null, 2));
    }

    console.log('Done.');
    return { totalShowsBefore, totalShowsAfter, migratedCount, flaggedForReview };
}

async function main() {
    await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`);
    console.log('Connected to database');
    await runMigration();
    await mongoose.disconnect();
}

// Only run as a CLI script, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
