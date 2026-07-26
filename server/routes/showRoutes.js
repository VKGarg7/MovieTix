import express from "express"
import { addShow, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";
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

export default showRouter;
