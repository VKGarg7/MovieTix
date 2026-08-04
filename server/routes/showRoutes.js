import express from "express"
import { addShow, deleteShow, editShow, getNowPlayingMovies, getShow, getShows, getSimilarMovies, searchBookableMovies, searchMovies, suggestShowtimes } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";
import { publicApiLimiter } from "../middleware/rateLimit.js";

const showRouter = express.Router();

/**
 * @openapi
 * /show/now-playing:
 *   get:
 *     summary: Get movies currently playing (from TMDB)
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only."
 *     responses:
 *       200:
 *         description: List of now-playing movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ id: 1234, title: "Example Movie", release_date: "2026-01-01" }]
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/now-playing', protectAdmin , getNowPlayingMovies)

/**
 * @openapi
 * /show/search:
 *   get:
 *     summary: Search for a movie by title (local DB first, falls back to TMDB)
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only. Used by the Add Show movie picker."
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Matching movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ id: 1234, title: "Example Movie" }]
 *               source: "local"
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/search', protectAdmin , searchMovies)

/**
 * @openapi
 * /show/add:
 *   post:
 *     summary: Add a new show (creates the movie record if it doesn't exist yet)
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only. A theater-admin may only add shows to a screen belonging to
 *       their own theater (403 otherwise); super-admins may target any screen.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId, showsInput, showPrice]
 *             properties:
 *               movieId: { type: string, example: "1234" }
 *               showsInput:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date: { type: string, example: "2026-08-01" }
 *                     time:
 *                       oneOf:
 *                         - type: string
 *                         - type: array
 *                           items: { type: string }
 *                       example: ["14:00", "18:30"]
 *               showPrice: { type: number, example: 250 }
 *     responses:
 *       200:
 *         description: Show(s) added
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Show Added successfully."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.post('/add' , protectAdmin , addShow)

/**
 * @openapi
 * /show/suggest-showtimes:
 *   get:
 *     summary: Suggest 2-3 showtime/price combinations based on historical occupancy
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only, scoped to the screen's own theater. Prefers historical occupancy
 *       for shows of the same genre at this theater; falls back to theater-wide history when
 *       there isn't enough genre-specific data, then to fixed defaults when the theater has
 *       no show history at all.
 *     parameters:
 *       - in: query
 *         name: movieId
 *         required: true
 *         schema: { type: string, example: "1234" }
 *       - in: query
 *         name: screenId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Suggested showtime/price combinations
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               suggestions:
 *                 - dayOfWeek: 5
 *                   dayLabel: Friday
 *                   slotLabel: Evening
 *                   suggestedTime: "18:00"
 *                   avgOccupancyPct: 72.5
 *                   suggestedPrice: 250
 *                   sampleSize: 4
 *                   confidence: high
 *                   basis: genre-history
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/suggest-showtimes' , protectAdmin , suggestShowtimes)

/**
 * @openapi
 * /show/all:
 *   get:
 *     summary: List all movies with at least one upcoming show
 *     tags: [Show]
 *     description: "Auth: none (public). Rate limited per IP."
 *     responses:
 *       200:
 *         description: Movies with upcoming shows
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               shows: [{ _id: "1234", title: "Example Movie" }]
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/all' , publicApiLimiter, getShows)

/**
 * @openapi
 * /show/all/search:
 *   get:
 *     summary: Search movies with upcoming shows by title/overview (falls back to TMDB if none found locally)
 *     tags: [Show]
 *     description: "Auth: none (public). Rate limited per IP."
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Matching movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ _id: "1234", title: "Example Movie" }]
 *               source: "local"
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/all/search' , publicApiLimiter, searchBookableMovies)

/**
 * @openapi
 * /show/similar/{movieId}:
 *   get:
 *     summary: Get movies sharing at least one genre with the given movie
 *     tags: [Show]
 *     description: >
 *       Auth: none (public). Rate limited per IP. Pulled from the local Movie collection
 *       (movies already synced via addShow). Returns an empty array if the movie has no
 *       recorded genres, or if fewer than 2 similar movies are found.
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Similar movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ _id: "1234", title: "Example Movie" }]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/similar/:movieId' , publicApiLimiter, getSimilarMovies)

/**
 * @openapi
 * /show/{movieId}:
 *   get:
 *     summary: Get a movie's details plus its upcoming showtimes grouped by date
 *     tags: [Show]
 *     description: "Auth: none (public). Rate limited per IP."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie details and dateTime map
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movie: { _id: "1234", title: "Example Movie" }
 *               dateTime:
 *                 "2026-08-01": [{ time: "2026-08-01T14:00:00+05:30", showId: "abc123" }]
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.get('/:movieId' , publicApiLimiter, getShow)

/**
 * @openapi
 * /show/{showId}:
 *   put:
 *     summary: Edit a show's date/time and/or price
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only, scoped to the owning theater. Changing showDateTime is blocked
 *       with a 409 if the show has any paid bookings; any pending (unpaid) reservations
 *       are invalidated (seats released, booking deleted, user notified by email).
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showDateTime: { type: string, example: "2026-08-01T18:30:00+05:30" }
 *               showPrice: { type: number, example: 300 }
 *     responses:
 *       200:
 *         description: Show updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Show updated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.put('/:showId', protectAdmin, editShow)

/**
 * @openapi
 * /show/{showId}:
 *   delete:
 *     summary: Cancel/delete a show
 *     tags: [Show]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only, scoped to the owning theater. Soft-deletes (isCancelled: true)
 *       so historical booking records remain valid; blocked with a 409 if the show has
 *       any paid bookings. Any pending (unpaid) reservations are invalidated.
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Show cancelled
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Show cancelled successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showRouter.delete('/:showId', protectAdmin, deleteShow)

export default showRouter;
