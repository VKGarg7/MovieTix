import mongoose from 'mongoose';
import axios from 'axios';
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


export const getNowPlayingMovies = asyncHandler(async (req, res) => {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
    })
    const movies = data.results;
    res.json({ success: true, movies: movies })
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
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
            })
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

    await inngest.send({
        name: 'app/show.added',
        data: {movieTitle: movie.title}
    })

    req.log.info({ movieId, showsCreated: showsToCreate.length }, 'Show added');
    res.json({ success: true, message: 'Show Added successfully.' });
});


export const getShows = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    const pipeline = [
        { $match: { showDateTime: { $gte: new Date() }, isCancelled: { $ne: true } } },
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
    ];

    if (theaterId) {
        pipeline.push({ $match: { 'screen.theater': new mongoose.Types.ObjectId(theaterId) } });
    }

    const [shows, movie] = await Promise.all([
        Show.aggregate(pipeline),
        Movie.findById(movieId),
    ]);

    const dateTime = {};

    shows.forEach((show) => {
        const date = show.showDateTime.toISOString().split("T")[0];
        if (!dateTime[date]) {
            dateTime[date] = []
        }
        dateTime[date].push({ time: show.showDateTime, showId: show._id, screen: show.screen })
    });

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
