import express from 'express';
import { getTrailerVoteForShow, castTrailerVote, exportTrailerVoteCsv } from '../controllers/trailerVoteController.js';
import { protectUser, protectAdmin } from '../middleware/auth.js';

const trailerVoteRouter = express.Router();

/**
 * @openapi
 * /trailer-vote/{showId}:
 *   get:
 *     summary: Get (or lazily create) the trailer-vote candidates and current tally for a show
 *     tags: [TrailerVote]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user. Candidates (2-3 other bookable movies with a trailer) are
 *       picked once per show on first request and fixed thereafter, so every voter compares
 *       the same options. hasEnoughVotes/winner are null until a minimum vote threshold is met.
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trailer vote state
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               candidates: [{ movieId: "1234", title: "Dune", votes: 5 }]
 *               totalVotes: 5
 *               myVote: null
 *               hasEnoughVotes: false
 *               winner: null
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Not enough other upcoming movies with trailers to run a vote
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
trailerVoteRouter.get('/:showId', protectUser, getTrailerVoteForShow);

/**
 * @openapi
 * /trailer-vote/{showId}/vote:
 *   post:
 *     summary: Cast (or change) your vote for the pre-show trailer of a specific showing
 *     tags: [TrailerVote]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user with a paid booking for this show. Voting closes once the
 *       show starts. Voting again before then updates your existing vote — only the
 *       latest choice counts, never a duplicate entry.
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [choice]
 *             properties:
 *               choice: { type: string, description: "One of the show's candidateMovieIds" }
 *     responses:
 *       200:
 *         description: Vote recorded, updated tally returned
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         description: Caller has no paid booking for this show
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
trailerVoteRouter.post('/:showId/vote', protectUser, castTrailerVote);

/**
 * @openapi
 * /trailer-vote/{showId}/export:
 *   get:
 *     summary: Export a show's trailer-vote results as CSV for projection staff
 *     tags: [TrailerVote]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV file with candidate vote counts and the winner
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
trailerVoteRouter.get('/:showId/export', protectAdmin, exportTrailerVoteCsv);

export default trailerVoteRouter;
