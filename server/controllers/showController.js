import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import sendEmail from '../configs/nodeMailer.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { assertScreenBelongsToTheater, hasPaidBookings } from '../utils/theaterScope.js';
import { releaseSeatsAndNotifyWaitlist, getSeatCapacityInfo } from '../utils/seatOperations.js';
import { renderEmail, highlight } from '../utils/emailTemplate.js';
import tmdb from '../utils/tmdbClient.js';
import { bookableShowFilter, getBookableMovieIds } from '../utils/showQueries.js';
import { getGenreNames } from '../utils/movieGenres.js';
import { fetchApplicableRules, computeShowPrice } from '../utils/dynamicPricing.js';
import { getShowtimeSuggestions } from '../utils/showtimeSuggestions.js';
import { recordAudit } from '../utils/auditLog.js';
import { maskMovieForMystery } from '../utils/mysteryMovie.js';


export const getNowPlayingMovies = asyncHandler(async (req, res) => {
    const { data } = await tmdb.get('/movie/now_playing');
    const movies = data.results;
    res.json({ success: true, movies: movies })
});


export const searchMovies = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json({ success: true, movies: [] });
    }

    const trimmedQuery = query.trim();

    const localMovies = await Movie.find(
        { $text: { $search: trimmedQuery } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(20);

    if (localMovies.length > 0) {
        return res.json({ success: true, movies: localMovies, source: 'local' });
    }

    const { data } = await tmdb.get('/search/movie', { params: { query: trimmedQuery } });

    res.json({ success: true, movies: data.results, source: 'tmdb' });
});


export const searchBookableMovies = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json({ success: true, movies: [], source: 'local' });
    }

    const trimmedQuery = query.trim();

    const bookableMovieIds = await getBookableMovieIds();

    const localMovies = await Movie.find(
        { _id: { $in: bookableMovieIds }, $text: { $search: trimmedQuery } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(20);

    if (localMovies.length > 0) {
        return res.json({ success: true, movies: localMovies, source: 'local' });
    }

    const { data } = await tmdb.get('/search/movie', { params: { query: trimmedQuery } });

    res.json({ success: true, movies: data.results, source: 'tmdb' });
});


const SIMILAR_MOVIES_LIMIT = 8;
const MIN_SIMILAR_MOVIES = 2;

export const getSimilarMovies = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
    }

    const genreNames = getGenreNames(movie);
    if (genreNames.length === 0) {
        return res.json({ success: true, movies: [] });
    }

    const similarMovies = await Movie.find({
        _id: { $ne: movieId },
        genres: { $elemMatch: { name: { $in: genreNames } } },
    }).limit(SIMILAR_MOVIES_LIMIT);

    if (similarMovies.length < MIN_SIMILAR_MOVIES) {
        return res.json({ success: true, movies: [] });
    }

    res.json({ success: true, movies: similarMovies });
});


const MYSTERY_REVEAL_VALUES = ['onBooking', 'atTheater'];

export const addShow = asyncHandler(async (req, res) => {
    const { movieId, screenId, showsInput, showPrice, isMysteryMovie, mysteryRevealAt } = req.body;

    if (!movieId || !screenId || !Array.isArray(showsInput) || showsInput.length === 0) {
        throw new AppError('movieId, screenId and showsInput are required', 400, 'INVALID_INPUT');
    }
    if (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
    }
    if (mysteryRevealAt !== undefined && !MYSTERY_REVEAL_VALUES.includes(mysteryRevealAt)) {
        throw new AppError(`mysteryRevealAt must be one of: ${MYSTERY_REVEAL_VALUES.join(', ')}`, 400, 'INVALID_INPUT');
    }

    const screen = await Screen.findById(screenId).populate('theater');
    if (!screen) {
        throw new AppError('Screen not found', 404, 'SCREEN_NOT_FOUND');
    }

    assertScreenBelongsToTheater(screen, req.adminContext);

    const theaterTimezone = screen.theater.timezone;

    let movie = await Movie.findById(movieId);

    if (!movie) {
        const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
            tmdb.get(`/movie/${movieId}`),
            tmdb.get(`/movie/${movieId}/credits`),
        ]);

        const movieApiData = movieDetailsResponse.data;
        const movieCreditsData = movieCreditsResponse.data;

        const movieDetails = {
            _id: movieId,
            title: movieApiData.title,
            overview: movieApiData.overview,
            poster_path: movieApiData.poster_path,
            backdrop_path: movieApiData.backdrop_path,
            genres: movieApiData.genres,
            casts: movieCreditsData.cast,
            release_date: movieApiData.release_date,
            original_language: movieApiData.original_language,
            tagline: movieApiData.tagline || "",
            vote_average: movieApiData.vote_average,
            runtime: movieApiData.runtime,
        };

        movie = await Movie.create(movieDetails);
    }

    const isFirstShowForMovie = !(await Show.exists({ movie: movieId }));

    const showsToCreate = [];

    showsInput.forEach(show => {
        const showDate = show.date;

        let timeArray;

        if (Array.isArray(show.time)) {
            timeArray = show.time;
        } else if (typeof show.time === 'string') {
            timeArray = show.time.split(',').map(t => t.trim());
        } else {
            req.log.warn({ time: show.time }, 'Invalid show time format');
            return;
        }

        timeArray.forEach((time) => {
            const showDateTime = DateTime.fromISO(`${showDate}T${time}`, { zone: theaterTimezone }).toJSDate();

            if (Number.isNaN(showDateTime.getTime())) {
                req.log.warn({ showDate, time, theaterTimezone }, 'Invalid show date/time, skipping');
                return;
            }

            showsToCreate.push({
                movie: movieId,
                screen: screenId,
                showDateTime,
                showPrice,
                occupiedSeats: {},
                isMysteryMovie: Boolean(isMysteryMovie),
                mysteryRevealAt: mysteryRevealAt || 'onBooking',
            });
        });
    });

    let insertedShows = [];
    if (showsToCreate.length > 0) {
        insertedShows = await Show.insertMany(showsToCreate);
    }

    if (isFirstShowForMovie && showsToCreate.length > 0) {
        await inngest.send({
            name: 'app/show.added',
            data: { movieId: movie._id, movieTitle: movie.title }
        })
    }

    if (insertedShows.length > 0) {
        await recordAudit({
            req,
            action: 'create',
            entityType: 'Show',
            entityId: insertedShows[0]._id,
            diff: {
                after: {
                    movieId,
                    screenId,
                    showPrice,
                    showsCreated: insertedShows.length,
                    showIds: insertedShows.map(s => s._id.toString()),
                    showDateTimes: insertedShows.map(s => s.showDateTime),
                },
            },
        });
    }

    req.log.info({ movieId, showsCreated: showsToCreate.length }, 'Show added');
    res.json({ success: true, message: 'Show Added successfully.' });
});


export const suggestShowtimes = asyncHandler(async (req, res) => {
    const { movieId, screenId } = req.query;

    if (!movieId || !screenId) {
        throw new AppError('movieId and screenId are required', 400, 'INVALID_INPUT');
    }
    if (!mongoose.Types.ObjectId.isValid(screenId)) {
        throw new AppError('Invalid screenId', 400, 'INVALID_INPUT');
    }

    const screen = await Screen.findById(screenId).populate('theater');
    if (!screen) {
        throw new AppError('Screen not found', 404, 'SCREEN_NOT_FOUND');
    }

    assertScreenBelongsToTheater(screen, req.adminContext);

    let movie = await Movie.findById(movieId);
    if (!movie) {
        try {
            const { data: movieApiData } = await tmdb.get(`/movie/${movieId}`);
            movie = { genres: movieApiData.genres };
        } catch (error) {
            req.log.warn({ err: error, movieId }, 'Could not fetch movie genres from TMDB for suggestions; falling back to theater-wide history');
            movie = null;
        }
    }

    const genreNames = movie ? getGenreNames(movie) : [];

    const suggestions = await getShowtimeSuggestions({
        theaterId: screen.theater._id,
        genreNames,
        timezone: screen.theater.timezone,
    });

    res.json({ success: true, suggestions });
});


export const getShows = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    const pipeline = [
        { $match: bookableShowFilter() },
    ];

    if (theaterId) {
        pipeline.push(
            { $lookup: { from: 'screens', localField: 'screen', foreignField: '_id', as: 'screen' } },
            { $unwind: '$screen' },
            { $match: { 'screen.theater': new mongoose.Types.ObjectId(theaterId) } }
        );
    }

    pipeline.push(
        { $group: { _id: '$movie', earliestShow: { $min: '$showDateTime' }, allMysteryUnrevealed: { $min: '$isMysteryMovie' } } },
        { $sort: { earliestShow: 1 } }
    );

    const movieOrder = await Show.aggregate(pipeline);

    const movies = await Movie.find({ _id: { $in: movieOrder.map(m => m._id) } });
    const movieById = new Map(movies.map(movie => [movie._id.toString(), movie]));

    const orderedMovies = movieOrder
        .map(({ _id, allMysteryUnrevealed }) => {
            const movie = movieById.get(_id.toString());
            if (!movie) return null;
            return allMysteryUnrevealed ? maskMovieForMystery(movie) : movie;
        })
        .filter(Boolean);

    res.json({ success: true, shows: orderedMovies });
});


export const getShow = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    const match = { movie: movieId, showDateTime: { $gte: new Date() }, isCancelled: { $ne: true } };

    const pipeline = [
        { $match: match },
        { $lookup: { from: 'screens', localField: 'screen', foreignField: '_id', as: 'screen' } },
        { $unwind: '$screen' },
        { $lookup: { from: 'theaters', localField: 'screen.theater', foreignField: '_id', as: 'screen.theater' } },
        { $unwind: '$screen.theater' },
    ];

    if (theaterId) {
        pipeline.push({ $match: { 'screen.theater._id': new mongoose.Types.ObjectId(theaterId) } });
    }

    const [shows, movie] = await Promise.all([
        Show.aggregate(pipeline),
        Movie.findById(movieId),
    ]);

    const rulesByTheater = new Map();
    const getRulesFor = async (tId) => {
        const key = tId.toString();
        if (!rulesByTheater.has(key)) {
            rulesByTheater.set(key, await fetchApplicableRules(tId));
        }
        return rulesByTheater.get(key);
    };

    const dateTime = {};
    let allShownMysteryUnrevealed = shows.length > 0;

    for (const show of shows) {
        const rules = await getRulesFor(show.screen.theater._id);
        const computedPrice = computeShowPrice(show.showPrice, rules, {
            showDateTime: show.showDateTime,
            timezone: show.screen.theater.timezone,
        });

        const date = show.showDateTime.toISOString().split("T")[0];
        if (!dateTime[date]) {
            dateTime[date] = []
        }

        const { occupiedCount, totalCapacity, isSoldOut } = getSeatCapacityInfo(show);
        if (!show.isMysteryMovie) allShownMysteryUnrevealed = false;

        dateTime[date].push({
            time: show.showDateTime,
            showId: show._id,
            screen: show.screen,
            showPrice: show.showPrice,
            computedPrice,
            occupiedCount,
            totalCapacity,
            isSoldOut,
            isMysteryMovie: show.isMysteryMovie,
            mysteryRevealAt: show.mysteryRevealAt,
        })
    }

    const responseMovie = allShownMysteryUnrevealed ? maskMovieForMystery(movie) : movie;

    res.json({ success: true, movie: responseMovie, dateTime })
});


const OCCUPANCY_PULSE_WINDOW_HOURS = 24;

const buildOccupancyPulse = async (theaterId) => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + OCCUPANCY_PULSE_WINDOW_HOURS * 60 * 60 * 1000);

    const pipeline = [
        {
            $match: {
                showDateTime: { $gte: now, $lte: windowEnd },
                isCancelled: { $ne: true },
            },
        },
        { $lookup: { from: 'screens', localField: 'screen', foreignField: '_id', as: 'screenDoc' } },
        { $unwind: '$screenDoc' },
        ...(theaterId ? [{ $match: { 'screenDoc.theater': new mongoose.Types.ObjectId(theaterId) } }] : []),
        { $lookup: { from: 'theaters', localField: 'screenDoc.theater', foreignField: '_id', as: 'theaterDoc' } },
        { $unwind: { path: '$theaterDoc', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'movies', localField: 'movie', foreignField: '_id', as: 'movieDoc' } },
        { $unwind: '$movieDoc' },
        {
            $project: {
                _id: 1,
                showDateTime: 1,
                showPrice: 1,
                title: '$movieDoc.title',
                poster_path: '$movieDoc.poster_path',
                genres: '$movieDoc.genres',
                original_language: '$movieDoc.original_language',
                runtime: '$movieDoc.runtime',
                vote_average: '$movieDoc.vote_average',
                screenName: '$screenDoc.name',
                theaterId: '$screenDoc.theater',
                theaterName: '$theaterDoc.name',
                totalCapacity: '$screenDoc.totalCapacity',
                occupiedCount: { $size: { $objectToArray: '$occupiedSeats' } },
            },
        },
        {
            $project: {
                _id: 1,
                showDateTime: 1,
                title: 1,
                poster_path: 1,
                genres: 1,
                original_language: 1,
                runtime: 1,
                vote_average: 1,
                screenName: 1,
                theaterId: 1,
                theaterName: 1,
                totalCapacity: 1,
                occupiedCount: 1,
                revenue: { $multiply: ['$occupiedCount', '$showPrice'] },
                occupancyPct: {
                    $cond: [
                        { $gt: ['$totalCapacity', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$occupiedCount', '$totalCapacity'] }, 100] }, 1] },
                        null,
                    ],
                },
            },
        },
        { $sort: { showDateTime: 1 } },
    ];

    return Show.aggregate(pipeline);
};

export const getOccupancyPulse = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;
    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }
    if (!theaterId) {
        throw new AppError('theaterId is required', 400, 'INVALID_INPUT');
    }

    const shows = await buildOccupancyPulse(theaterId);
    res.json({ success: true, windowHours: OCCUPANCY_PULSE_WINDOW_HOURS, shows });
});

export const getAdminOccupancyPulse = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const { theaterId: queryTheaterId } = req.query;

    let scopedTheaterId = null;
    if (role === 'theaterAdmin') {
        scopedTheaterId = theaterId;
    } else if (queryTheaterId) {
        if (!mongoose.Types.ObjectId.isValid(queryTheaterId)) {
            throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
        }
        scopedTheaterId = queryTheaterId;
    }

    const shows = await buildOccupancyPulse(scopedTheaterId);
    res.json({ success: true, windowHours: OCCUPANCY_PULSE_WINDOW_HOURS, shows });
});

const loadShowForAdmin = async (showId, adminContext) => {
    if (!mongoose.Types.ObjectId.isValid(showId)) {
        throw new AppError('Invalid showId', 400, 'INVALID_INPUT');
    }

    const show = await Show.findById(showId).populate('screen');
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    assertScreenBelongsToTheater(show.screen, adminContext);
    return show;
};

const invalidatePendingBookings = async (show, movieTitle) => {
    const pendingBookings = await Booking.find({ show: show._id.toString(), isPaid: false });
    if (pendingBookings.length === 0) return;

    const seatsToRelease = pendingBookings.flatMap(b => b.bookedSeats);
    await releaseSeatsAndNotifyWaitlist(show._id, seatsToRelease);

    await Booking.deleteMany({ _id: { $in: pendingBookings.map(b => b._id) } });

    const userIds = [...new Set(pendingBookings.map(b => b.user))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    await Promise.allSettled(users.map(user => sendEmail({
        to: user.email,
        subject: `Your pending booking for "${movieTitle}" was cancelled`,
        body: renderEmail({
            greetingName: user.name,
            bodyHtml: `
                <p>The showtime for ${highlight(`"${movieTitle}"`)} you had reserved seats for has changed.</p>
                <p>Your pending (unpaid) seat reservation has been released. Please book again if you're still interested.</p>
            `,
            closingLine: 'Sorry for the inconvenience!',
        }),
    })));
};

export const editShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;
    const { showDateTime, showPrice, isMysteryMovie, mysteryRevealAt } = req.body;

    if (showDateTime === undefined && showPrice === undefined && isMysteryMovie === undefined && mysteryRevealAt === undefined) {
        throw new AppError('At least one field to update is required', 400, 'INVALID_INPUT');
    }
    if (showPrice !== undefined && (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0)) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
    }
    if (mysteryRevealAt !== undefined && !MYSTERY_REVEAL_VALUES.includes(mysteryRevealAt)) {
        throw new AppError(`mysteryRevealAt must be one of: ${MYSTERY_REVEAL_VALUES.join(', ')}`, 400, 'INVALID_INPUT');
    }
    let parsedDateTime;
    if (showDateTime !== undefined) {
        parsedDateTime = new Date(showDateTime);
        if (Number.isNaN(parsedDateTime.getTime())) {
            throw new AppError('showDateTime is not a valid date', 400, 'INVALID_INPUT');
        }
    }

    const show = await loadShowForAdmin(showId, req.adminContext);

    const timeIsChanging = parsedDateTime && parsedDateTime.getTime() !== show.showDateTime.getTime();
    if (timeIsChanging && await hasPaidBookings(show._id)) {
        throw new AppError('Cannot change the showtime of a show with paid bookings; cancel those bookings first', 409, 'SHOW_HAS_PAID_BOOKINGS');
    }
    const mysteryIsChanging = (isMysteryMovie !== undefined && isMysteryMovie !== show.isMysteryMovie)
        || (mysteryRevealAt !== undefined && mysteryRevealAt !== show.mysteryRevealAt);
    if (mysteryIsChanging && await hasPaidBookings(show._id)) {
        throw new AppError('Cannot change mystery-movie settings on a show with paid bookings', 409, 'SHOW_HAS_PAID_BOOKINGS');
    }

    const before = {
        showDateTime: show.showDateTime,
        showPrice: show.showPrice,
        isMysteryMovie: show.isMysteryMovie,
        mysteryRevealAt: show.mysteryRevealAt,
    };

    if (showPrice !== undefined) show.showPrice = showPrice;
    if (parsedDateTime) show.showDateTime = parsedDateTime;
    if (isMysteryMovie !== undefined) show.isMysteryMovie = isMysteryMovie;
    if (mysteryRevealAt !== undefined) show.mysteryRevealAt = mysteryRevealAt;
    await show.save();

    if (timeIsChanging) {
        const movie = await Movie.findById(show.movie);
        await invalidatePendingBookings(show, movie?.title ?? 'your movie');
    }

    await recordAudit({
        req,
        action: 'update',
        entityType: 'Show',
        entityId: show._id,
        diff: {
            before,
            after: {
                showDateTime: show.showDateTime,
                showPrice: show.showPrice,
                isMysteryMovie: show.isMysteryMovie,
                mysteryRevealAt: show.mysteryRevealAt,
            },
        },
    });

    req.log.info({ showId }, 'Show updated');
    res.json({ success: true, message: 'Show updated successfully', show });
});


export const deleteShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    const show = await loadShowForAdmin(showId, req.adminContext);

    if (await hasPaidBookings(show._id)) {
        throw new AppError('Cannot delete a show with paid bookings; cancel those bookings first', 409, 'SHOW_HAS_PAID_BOOKINGS');
    }

    const movie = await Movie.findById(show.movie);
    await invalidatePendingBookings(show, movie?.title ?? 'your movie');

    show.isCancelled = true;
    await show.save();

    await recordAudit({
        req,
        action: 'delete',
        entityType: 'Show',
        entityId: show._id,
        diff: { before: { isCancelled: false }, after: { isCancelled: true } },
    });

    req.log.info({ showId }, 'Show cancelled');
    res.json({ success: true, message: 'Show cancelled successfully' });
});


export const editMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { hasPostCreditsScene } = req.body;

    if (hasPostCreditsScene === undefined) {
        throw new AppError('hasPostCreditsScene is required', 400, 'INVALID_INPUT');
    }
    if (typeof hasPostCreditsScene !== 'boolean') {
        throw new AppError('hasPostCreditsScene must be a boolean', 400, 'INVALID_INPUT');
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
    }

    const before = { hasPostCreditsScene: movie.hasPostCreditsScene };
    movie.hasPostCreditsScene = hasPostCreditsScene;
    await movie.save();

    await recordAudit({
        req,
        action: 'update',
        entityType: 'Movie',
        entityId: movie._id,
        diff: { before, after: { hasPostCreditsScene: movie.hasPostCreditsScene } },
    });

    req.log.info({ movieId, hasPostCreditsScene }, 'Movie updated');
    res.json({ success: true, message: 'Movie updated successfully', movie });
});
