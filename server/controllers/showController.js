import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';


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
    const { movieId, showsInput, showPrice } = req.body;

    if (!movieId || !Array.isArray(showsInput) || showsInput.length === 0) {
        throw new AppError('movieId and showsInput are required', 400, 'INVALID_INPUT');
    }
    if (typeof showPrice !== 'number' || !Number.isFinite(showPrice) || showPrice <= 0) {
        throw new AppError('showPrice must be a positive number', 400, 'INVALID_INPUT');
    }

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


// API to get all shows from the database
export const getShows = asyncHandler(async (req, res) => {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
                            .populate('movie')
                            .sort({ showDateTime: 1 });


    const uniqueShowsMap = new Map();

    shows.forEach((show) => {
        const movieId = show.movie._id?.toString() || show.movie?.toString();
        if (!uniqueShowsMap.has(movieId)) {
            uniqueShowsMap.set(movieId, show.movie);
        }
    });

    res.json({ success: true, shows: Array.from(uniqueShowsMap.values()) });
});


// API to get a single show from the databse
export const getShow = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    //get all upcoming shows for the movie
    const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
        const date = show.showDateTime.toISOString().split("T")[0];
        if (!dateTime[date]) {
            dateTime[date] = []
        }
        dateTime[date].push({ time: show.showDateTime, showId: show._id })
    })
    res.json({ success: true, movie, dateTime })
});
