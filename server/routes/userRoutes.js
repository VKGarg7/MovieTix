import express from 'express';
import { getFavorites, getUserBookings, updateFavorite } from '../controllers/userController.js';
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
 *     responses:
 *       200:
 *         description: The user's bookings
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               bookings: [{ _id: "def456", amount: 500, isPaid: true }]
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

export default userRouter;
