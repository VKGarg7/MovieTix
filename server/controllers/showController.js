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
import { releaseSeatsAtomic } from '../utils/seatOperations.js';
import { renderEmail, highlight } from '../utils/emailTemplate.js';
import tmdb from '../utils/tmdbClient.js';
import { bookableShowFilter, getBookableMovieIds } from '../utils/showQueries.js';
import { getGenreNames } from '../utils/movieGenres.js';
import { fetchApplicableRules, computeShowPrice } from '../utils/dynamicPricing.js';


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


export const addShow = asyncHandler(async (req, res) => {
    const { movieId, screenId, showsInput, showPrice } = req.body;

    if (!movieId || !screenId || !Array.isArray(showsInput) || showsInput.length === 0) {
        throw new AppError('movieId, screenId and showsInput are required', 400, 'INVALID_INPUT');
    }
    if (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
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
                occupiedSeats: {}
            });
        });
    });

    if (showsToCreate.length > 0) {
        await Show.insertMany(showsToCreate);
    }

    if (isFirstShowForMovie && showsToCreate.length > 0) {
        await inngest.send({
            name: 'app/show.added',
            data: { movieId: movie._id, movieTitle: movie.title }
        })
    }

    req.log.info({ movieId, showsCreated: showsToCreate.length }, 'Show added');
    res.json({ success: true, message: 'Show Added successfully.' });
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
        { $group: { _id: '$movie', earliestShow: { $min: '$showDateTime' } } },
        { $sort: { earliestShow: 1 } }
    );

    const movieOrder = await Show.aggregate(pipeline);

    const movies = await Movie.find({ _id: { $in: movieOrder.map(m => m._id) } });
    const movieById = new Map(movies.map(movie => [movie._id.toString(), movie]));

    const orderedMovies = movieOrder
        .map(({ _id }) => movieById.get(_id.toString()))
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
        dateTime[date].push({
            time: show.showDateTime,
            showId: show._id,
            screen: show.screen,
            showPrice: show.showPrice,
            computedPrice,
        })
    }

    res.json({ success: true, movie, dateTime })
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
    await releaseSeatsAtomic(show._id, seatsToRelease);

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
    const { showDateTime, showPrice } = req.body;

    if (showDateTime === undefined && showPrice === undefined) {
        throw new AppError('showDateTime and/or showPrice are required', 400, 'INVALID_INPUT');
    }
    if (showPrice !== undefined && (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0)) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
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

    if (showPrice !== undefined) show.showPrice = showPrice;
    if (parsedDateTime) show.showDateTime = parsedDateTime;
    await show.save();

    if (timeIsChanging) {
        const movie = await Movie.findById(show.movie);
        await invalidatePendingBookings(show, movie?.title ?? 'your movie');
    }

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

    req.log.info({ showId }, 'Show cancelled');
    res.json({ success: true, message: 'Show cancelled successfully' });
});
