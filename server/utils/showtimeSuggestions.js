import { DateTime } from 'luxon';
import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import Movie from '../models/Movie.js';

const TIME_SLOTS = [
    { label: 'Morning', startHour: 9, endHour: 12, suggestedTime: '10:30' },
    { label: 'Afternoon', startHour: 12, endHour: 16, suggestedTime: '14:00' },
    { label: 'Evening', startHour: 16, endHour: 19, suggestedTime: '18:00' },
    { label: 'Night', startHour: 19, endHour: 23, suggestedTime: '20:30' },
];

const slotForHour = (hour) => TIME_SLOTS.find(s => hour >= s.startHour && hour < s.endHour) || TIME_SLOTS[TIME_SLOTS.length - 1];

const DEFAULT_SUGGESTIONS = [
    { dayOfWeek: 5, dayLabel: 'Friday', slotLabel: 'Evening', suggestedTime: '18:00', suggestedPrice: 200, confidence: 'low', basis: 'default' },
    { dayOfWeek: 6, dayLabel: 'Saturday', slotLabel: 'Night', suggestedTime: '20:30', suggestedPrice: 200, confidence: 'low', basis: 'default' },
];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const aggregateShowPerformance = async (showIds, timezone) => {
    if (showIds.length === 0) return [];

    const shows = await Show.find({ _id: { $in: showIds }, isCancelled: { $ne: true } })
        .populate('screen');

    const buckets = new Map();

    for (const show of shows) {
        const capacity = show.screen?.totalCapacity;
        if (!capacity) continue;

        const occupiedCount = Object.keys(show.occupiedSeats || {}).length;
        const occupancyPct = occupiedCount / capacity;

        const local = DateTime.fromJSDate(show.showDateTime, { zone: timezone });
        const dayOfWeek = local.weekday % 7;
        const slot = slotForHour(local.hour);
        const key = `${dayOfWeek}-${slot.label}`;

        if (!buckets.has(key)) {
            buckets.set(key, {
                dayOfWeek,
                dayLabel: DAY_LABELS[dayOfWeek],
                slotLabel: slot.label,
                suggestedTime: slot.suggestedTime,
                totalOccupancyPct: 0,
                totalPrice: 0,
                sampleSize: 0,
            });
        }

        const bucket = buckets.get(key);
        bucket.totalOccupancyPct += occupancyPct;
        bucket.totalPrice += show.showPrice;
        bucket.sampleSize += 1;
    }

    return Array.from(buckets.values()).map(bucket => ({
        dayOfWeek: bucket.dayOfWeek,
        dayLabel: bucket.dayLabel,
        slotLabel: bucket.slotLabel,
        suggestedTime: bucket.suggestedTime,
        avgOccupancyPct: Math.round((bucket.totalOccupancyPct / bucket.sampleSize) * 1000) / 10,
        suggestedPrice: Math.round(bucket.totalPrice / bucket.sampleSize),
        sampleSize: bucket.sampleSize,
    }));
};

const MAX_SUGGESTIONS = 3;
const MIN_SAMPLE_SIZE_FOR_HIGH_CONFIDENCE = 3;

const rankBuckets = (buckets, confidence, basis) =>
    [...buckets]
        .sort((a, b) => b.avgOccupancyPct - a.avgOccupancyPct)
        .slice(0, MAX_SUGGESTIONS)
        .map(bucket => ({
            ...bucket,
            confidence: bucket.sampleSize >= MIN_SAMPLE_SIZE_FOR_HIGH_CONFIDENCE ? confidence : 'low',
            basis,
        }));

export const getShowtimeSuggestions = async ({ theaterId, genreNames, timezone }) => {
    const theaterScreenIds = (await Screen.find({ theater: theaterId }, { _id: 1 }).lean()).map(s => s._id);

    let genreMatchedShowIds = [];
    if (genreNames?.length) {
        const genreMatchedMovieIds = (await Movie.find({ 'genres.name': { $in: genreNames } }, { _id: 1 }).lean()).map(m => m._id);
        if (genreMatchedMovieIds.length > 0) {
            genreMatchedShowIds = (await Show.find({
                screen: { $in: theaterScreenIds },
                movie: { $in: genreMatchedMovieIds },
            }, { _id: 1 }).lean()).map(s => s._id);
        }
    }

    const genreBuckets = await aggregateShowPerformance(genreMatchedShowIds, timezone);
    if (genreBuckets.length >= 2) {
        return rankBuckets(genreBuckets, 'high', 'genre-history');
    }

    const theaterShowIds = (await Show.find({ screen: { $in: theaterScreenIds } }, { _id: 1 }).lean()).map(s => s._id);
    const theaterBuckets = await aggregateShowPerformance(theaterShowIds, timezone);
    if (theaterBuckets.length >= 2) {
        const genreKeys = new Set(genreBuckets.map(b => `${b.dayOfWeek}-${b.slotLabel}`));
        const nonOverlapping = theaterBuckets.filter(b => !genreKeys.has(`${b.dayOfWeek}-${b.slotLabel}`));
        return rankBuckets([...genreBuckets, ...nonOverlapping], 'medium', 'theater-history');
    }

    return DEFAULT_SUGGESTIONS;
};
