import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { protectUser } from '../middleware/auth.js';

const recommendationRouter = express.Router();

/**
 * @openapi
 * /recommendations:
 *   get:
 *     summary: Get personalized movie recommendations for the authenticated user
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user. v1 scores not-yet-booked bookable movies by weighted
 *       genre-overlap with the user's paid booking history (weighted higher) and
 *       followed movies (weighted lower), tie-broken by TMDB rating. Falls back to
 *       rating-only ranking when the user has no booking/follow history, or when no
 *       genre overlap exists with any candidate.
 *     responses:
 *       200:
 *         description: Up to 5 recommended movies, each with a plain-language reason
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               recommendations:
 *                 - movie: { _id: "1234", title: "Example Movie" }
 *                   reason: "Because you liked Paper Moons (Drama)"
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
recommendationRouter.get('/', protectUser, getRecommendations);

export default recommendationRouter;
