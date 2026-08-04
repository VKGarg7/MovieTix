import Show from '../models/Show.js';
import PriceWatch from '../models/PriceWatch.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { SCREEN_WITH_THEATER, resolveTheaterContext } from '../utils/theaterScope.js';
import { getComputedPriceForShow } from '../utils/dynamicPricing.js';

export const watchShowPrice = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { showId } = req.body;

    if (!showId || typeof showId !== 'string') {
        throw new AppError('showId is required', 400, 'INVALID_INPUT');
    }

    const show = await Show.findById(showId).populate(SCREEN_WITH_THEATER);
    if (!show || show.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }
    if (show.showDateTime.getTime() <= Date.now()) {
        throw new AppError('This show has already started', 409, 'SHOW_STARTED');
    }

    const { theaterId, timezone } = resolveTheaterContext(show);
    const currentPrice = await getComputedPriceForShow(show, theaterId, timezone);

    const watch = await PriceWatch.findOneAndUpdate(
        { user: userId, show: showId },
        {
            user: userId,
            show: showId,
            priceAtWatchTime: currentPrice,
            lastNotifiedPrice: null,
            lastNotifiedAt: null,
            status: 'active',
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, watching: true, priceAtWatchTime: watch.priceAtWatchTime });
});

export const unwatchShowPrice = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { showId } = req.params;

    await PriceWatch.deleteOne({ user: userId, show: showId, status: 'active' });

    res.json({ success: true, watching: false });
});

export const getWatchStatus = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { showId } = req.params;

    const watch = await PriceWatch.findOne({ user: userId, show: showId, status: 'active' });

    res.json({
        success: true,
        watching: Boolean(watch),
        priceAtWatchTime: watch?.priceAtWatchTime ?? null,
    });
});

export const getMyPriceWatches = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;

    const watches = await PriceWatch.find({ user: userId, status: 'active' }).sort({ createdAt: -1 });
    const shows = await Show.find({ _id: { $in: watches.map(w => w.show) } })
        .populate('movie')
        .populate(SCREEN_WITH_THEATER);
    const showById = new Map(shows.map(s => [s._id.toString(), s]));

    const results = [];
    for (const watch of watches) {
        const show = showById.get(watch.show);
        if (!show) continue;
        const { theaterId, timezone } = resolveTheaterContext(show);
        const currentPrice = await getComputedPriceForShow(show, theaterId, timezone);
        results.push({
            showId: show._id,
            movieTitle: show.movie?.title,
            showDateTime: show.showDateTime,
            theater: show.screen?.theater?.name,
            priceAtWatchTime: watch.priceAtWatchTime,
            currentPrice,
        });
    }

    res.json({ success: true, watches: results });
});
