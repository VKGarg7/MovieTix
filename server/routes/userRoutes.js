import express from 'express';
import { followMovie, getFavorites, getFollowedMovies, getFollowStatus, getUserBookings, unfollowMovie, updateFavorite } from '../controllers/userController.js';
import { protectUser } from '../middleware/auth.js';

const userRouter = express.Router();

/**
 * @openapi
 * /user/bookings:
 *   get:
 *     summary: Get the authenticated user's bookings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Upcoming, Completed, Cancelled] }
 *         description: Filter to a single tab category; omit to get all bookings.
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: The user's bookings
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               bookings: [{ _id: "def456", amount: 500, isPaid: true }]
 *               pageInfo: { page: 1, limit: 20, total: 42, totalPages: 3 }
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.get('/bookings', protectUser, getUserBookings);

/**
 * @openapi
 * /user/update-favorite:
 *   post:
 *     summary: Toggle a movie in the authenticated user's favorites list
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Adds movieId if absent, removes it if already present."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId]
 *             properties:
 *               movieId: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: Favorites updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Favorite movies updated"
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.post('/update-favorite', protectUser, updateFavorite);

/**
 * @openapi
 * /user/favorites:
 *   get:
 *     summary: Get the authenticated user's favorite movies
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: Favorite movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ _id: "1234", title: "Example Movie" }]
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.get('/favorites', protectUser, getFavorites);

/**
 * @openapi
 * /user/follow:
 *   post:
 *     summary: Follow a movie to get notified when a show is first added for it
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId]
 *             properties:
 *               movieId: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: Now following the movie
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               following: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.post('/follow', protectUser, followMovie);

/**
 * @openapi
 * /user/follow/{movieId}:
 *   delete:
 *     summary: Unfollow a movie
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: No longer following the movie
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               following: false
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.delete('/follow/:movieId', protectUser, unfollowMovie);

/**
 * @openapi
 * /user/follow/{movieId}:
 *   get:
 *     summary: Check whether the authenticated user follows a movie
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Follow status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               following: false
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.get('/follow/:movieId', protectUser, getFollowStatus);

/**
 * @openapi
 * /user/following:
 *   get:
 *     summary: Get all movies the authenticated user follows
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: Followed movies
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               movies: [{ _id: "1234", title: "Example Movie" }]
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
userRouter.get('/following', protectUser, getFollowedMovies);

export default userRouter;
