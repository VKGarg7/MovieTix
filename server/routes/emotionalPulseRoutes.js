import express from 'express';
import { upsertEmotionalPulse, getMyPulseForBooking, getMovieEmotionalBreakdown } from '../controllers/emotionalPulseController.js';
import { protectUser } from '../middleware/auth.js';
import { publicApiLimiter } from '../middleware/rateLimit.js';

const emotionalPulseRouter = express.Router();

/**
 * @openapi
 * /emotional-pulse:
 *   post:
 *     summary: Log a one-tap emotional-tag reaction for a completed booking
 *     tags: [EmotionalPulse]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user (must own the booking). Only allowed once the booking's
 *       showtime has passed. One tag per booking — tagging again edits the existing
 *       entry instead of creating a duplicate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, tag]
 *             properties:
 *               bookingId: { type: string }
 *               tag: { type: string, enum: [moved, thrilled, meh, haunted, inspired, laughed, bored] }
 *     responses:
 *       200:
 *         description: Tag logged
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
emotionalPulseRouter.post('/', protectUser, upsertEmotionalPulse);

/**
 * @openapi
 * /emotional-pulse/booking/{bookingId}:
 *   get:
 *     summary: Get the authenticated user's logged tag for a booking, if any
 *     tags: [EmotionalPulse]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Used to show the prompt as already-answered."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The caller's tag for this booking, or null
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
emotionalPulseRouter.get('/booking/:bookingId', protectUser, getMyPulseForBooking);

/**
 * @openapi
 * /emotional-pulse/movie/{movieId}:
 *   get:
 *     summary: Get the aggregated emotional-tag breakdown for a movie
 *     tags: [EmotionalPulse]
 *     description: "Auth: none (public). Rate limited per IP."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tag breakdown
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               breakdown: [{ tag: "moved", count: 12 }, { tag: "thrilled", count: 8 }]
 *               total: 20
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
emotionalPulseRouter.get('/movie/:movieId', publicApiLimiter, getMovieEmotionalBreakdown);

export default emotionalPulseRouter;
