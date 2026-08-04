import express from 'express';
import { watchShowPrice, unwatchShowPrice, getWatchStatus, getMyPriceWatches } from '../controllers/priceWatchController.js';
import { protectUser } from '../middleware/auth.js';

const priceWatchRouter = express.Router();

/**
 * @openapi
 * /price-watch:
 *   post:
 *     summary: Start watching a show's dynamic price for a drop
 *     tags: [PriceWatch]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Records the show's currently computed price as the baseline; re-watching an already-watched show resets the baseline to the current price."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId]
 *             properties:
 *               showId: { type: string }
 *     responses:
 *       200:
 *         description: Watch created/updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
priceWatchRouter.post('/', protectUser, watchShowPrice);

/**
 * @openapi
 * /price-watch/mine:
 *   get:
 *     summary: List the authenticated user's active price watches
 *     tags: [PriceWatch]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: Active price watches with their current computed price
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
priceWatchRouter.get('/mine', protectUser, getMyPriceWatches);

/**
 * @openapi
 * /price-watch/{showId}:
 *   get:
 *     summary: Check whether the authenticated user is watching a show's price
 *     tags: [PriceWatch]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Watch status
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
priceWatchRouter.get('/:showId', protectUser, getWatchStatus);

/**
 * @openapi
 * /price-watch/{showId}:
 *   delete:
 *     summary: Stop watching a show's price
 *     tags: [PriceWatch]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Watch removed
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
priceWatchRouter.delete('/:showId', protectUser, unwatchShowPrice);

export default priceWatchRouter;
