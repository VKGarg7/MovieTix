import express from 'express';
import { getMovieReviews, getMyReviewForMovie, upsertReview } from '../controllers/reviewController.js';
import { protectUser } from '../middleware/auth.js';
import { publicApiLimiter } from '../middleware/rateLimit.js';

const reviewRouter = express.Router();

/**
 * @openapi
 * /review:
 *   post:
 *     summary: Submit or edit a review for a movie
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user. Only succeeds if the caller has a paid booking for a show
 *       of this movie whose showDateTime is in the past. One review per user per movie
 *       — submitting again edits the existing review instead of creating a duplicate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId, rating]
 *             properties:
 *               movieId: { type: string, example: "1234" }
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               text: { type: string, example: "Great watch, would recommend." }
 *     responses:
 *       200:
 *         description: Review created/updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               review: { _id: "abc123", rating: 4, text: "Great watch, would recommend." }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         description: Caller has no completed paid booking for this movie
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
reviewRouter.post('/', protectUser, upsertReview);

/**
 * @openapi
 * /review/me/{movieId}:
 *   get:
 *     summary: Get the authenticated user's own review for a movie, if any
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Used to pre-fill the review form for editing."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The caller's review, or null if none exists
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               review: null
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
reviewRouter.get('/me/:movieId', protectUser, getMyReviewForMovie);

/**
 * @openapi
 * /review/{movieId}:
 *   get:
 *     summary: Get all reviews and the average rating for a movie
 *     tags: [Review]
 *     description: "Auth: none (public). Rate limited per IP."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reviews and aggregate rating
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               reviews: [{ _id: "abc123", rating: 4, text: "Great watch." }]
 *               averageRating: 4.2
 *               reviewCount: 15
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
reviewRouter.get('/:movieId', publicApiLimiter, getMovieReviews);

export default reviewRouter;
