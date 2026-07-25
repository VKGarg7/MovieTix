import mongoose from 'mongoose';
import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { assertScreenBelongsToTheater } from '../utils/theaterScope.js';


// API to get now playing movies from TMDB API
export const getNowPlayingMovies = asyncHandler(async (req, res) => {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
    })
    const movies = data.results;
    res.json({ success: true, movies: movies })
});


// API to add a new show to the database
export const addShow = asyncHandler(async (req, res) => {
    const { movieId, screenId, showsInput, showPrice } = req.body;

    if (!movieId || !screenId || !Array.isArray(showsInput) || showsInput.length === 0) {
        throw new AppError('movieId, screenId and showsInput are required', 400, 'INVALID_INPUT');
    }
    if (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
    }

    const screen = await Screen.findById(screenId);
    if (!screen) {
        throw new AppError('Screen not found', 404, 'SCREEN_NOT_FOUND');
    }

    assertScreenBelongsToTheater(screen, req.adminContext);

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
            const dateTimeString = `${showDate}T${time}+05:30`;
            const showDateTime = new Date(dateTimeString);

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

    //Trigger inngest event
    await inngest.send({
        name: 'app/show.added',
        data: {movieTitle: movie.title}
    })

    req.log.info({ movieId, showsCreated: showsToCreate.length }, 'Show added');
    res.json({ success: true, message: 'Show Added successfully.' });
});


// API to get all shows from the database, optionally filtered to a single theater
export const getShows = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    const pipeline = [
        { $match: { showDateTime: { $gte: new Date() } } },
    ];

    if (theaterId) {
        pipeline.push(
            { $lookup: { from: 'screens', localField: 'screen', foreignField: '_id', as: 'screen' } },
            { $unwind: '$screen' },
            { $match: { 'screen.theater': new mongoose.Types.ObjectId(theaterId) } }
        );
    }

    // Earliest upcoming showDateTime per movie, so results can be sorted without
    // fetching every show document (there are many shows per movie).
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


// API to get a single show from the databse, optionally filtered to a single theater
export const getShow = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { theaterId } = req.query;

    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    // Filter by theater in the query itself (via a screen lookup) instead of
    // fetching every upcoming show for this movie across all theaters and
    // discarding most in JS — a movie can play at dozens of theaters at once.
    const match = { movie: movieId, showDateTime: { $gte: new Date() } };

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
