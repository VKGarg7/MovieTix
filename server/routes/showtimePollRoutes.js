import express from 'express';
import {
    createShowtimePoll,
    getShowtimePollStatus,
    voteOnShowtimePoll,
    closeShowtimePoll,
    getMyShowtimePolls,
} from '../controllers/showtimePollController.js';
import { protectUser } from '../middleware/auth.js';
import { showtimePollLimiter } from '../middleware/rateLimit.js';

const showtimePollRouter = express.Router();

/**
 * @openapi
 * /showtime-poll/create:
 *   post:
 *     summary: Create a showtime poll across 2-4 candidate shows and generate a shareable link
 *     tags: [ShowtimePoll]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (becomes the organizer)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showIds, inviteeNames]
 *             properties:
 *               showIds:
 *                 type: array
 *                 items: { type: string }
 *                 minItems: 2
 *                 maxItems: 4
 *               inviteeNames:
 *                 type: array
 *                 items: { type: string, example: "Alex" }
 *               expiresInHours: { type: integer, example: 48, description: "Defaults to 48, max 168." }
 *               organizerNote: { type: string, example: "Which one works for everyone?" }
 *     responses:
 *       200:
 *         description: Poll created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showtimePollRouter.post('/create', protectUser, createShowtimePoll);

/**
 * @openapi
 * /showtime-poll/mine:
 *   get:
 *     summary: List showtime polls organized by the authenticated user
 *     tags: [ShowtimePoll]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: The user's showtime polls
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showtimePollRouter.get('/mine', protectUser, getMyShowtimePolls);

/**
 * @openapi
 * /showtime-poll/{pollId}/status:
 *   get:
 *     summary: Get the live vote status of a showtime poll
 *     tags: [ShowtimePoll]
 *     description: "Auth: none (public). Rate limited. Safe to show to any invitee before sign-in."
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Poll status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showtimePollRouter.get('/:pollId/status', showtimePollLimiter, getShowtimePollStatus);

/**
 * @openapi
 * /showtime-poll/{pollId}/vote:
 *   post:
 *     summary: Cast or update a vote on a showtime poll
 *     tags: [ShowtimePoll]
 *     description: "Auth: none (public, name-only). Rate limited. Voting to quorum auto-closes the poll into a group booking, unless the top two candidates are tied."
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, showId]
 *             properties:
 *               name: { type: string, example: "Alex" }
 *               showId: { type: string }
 *     responses:
 *       200:
 *         description: Vote recorded
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
showtimePollRouter.post('/:pollId/vote', showtimePollLimiter, voteOnShowtimePoll);

/**
 * @openapi
 * /showtime-poll/{pollId}/close:
 *   post:
 *     summary: Manually close a showtime poll, creating a group booking for the winning (or chosen) show
 *     tags: [ShowtimePoll]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the organizer). If votes are tied, winningShowId must be passed to break the tie."
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               winningShowId: { type: string }
 *     responses:
 *       200:
 *         description: Poll closed, group booking created
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
showtimePollRouter.post('/:pollId/close', protectUser, closeShowtimePoll);

export default showtimePollRouter;
