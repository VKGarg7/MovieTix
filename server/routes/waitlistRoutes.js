import express from 'express';
import {
    joinWaitlist,
    leaveWaitlist,
    getMyWaitlist,
    getWaitlistEntryStatus,
    claimWaitlistOffer,
} from '../controllers/waitlistController.js';
import { protectUser } from '../middleware/auth.js';

const waitlistRouter = express.Router();

/**
 * @openapi
 * /waitlist/join:
 *   post:
 *     summary: Join the waitlist for a sold-out show
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Only allowed when the show is actually sold out (occupied seats >= screen capacity). Rejects a duplicate active entry for the same user+show."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId]
 *             properties:
 *               showId: { type: string, example: "60f7c0f1e1b1c8a1b8f1e1b1" }
 *     responses:
 *       200:
 *         description: Joined the waitlist
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               waitlistEntryId: "66f7c0f1e1b1c8a1b8f1e1b3"
 *               position: 2
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
waitlistRouter.post('/join', protectUser, joinWaitlist);

/**
 * @openapi
 * /waitlist/{showId}/leave:
 *   post:
 *     summary: Leave the waitlist for a show
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Valid while the entry is waiting or offered. If a seat was actively offered to this entry, it's released and immediately cycled to the next waiting entry."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Left the waitlist
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
waitlistRouter.post('/:showId/leave', protectUser, leaveWaitlist);

/**
 * @openapi
 * /waitlist/mine:
 *   get:
 *     summary: List the authenticated user's active waitlist entries
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns entries with status waiting (with queue position) or offered (with the offered seat and expiry)."
 *     responses:
 *       200:
 *         description: The user's waitlist entries
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
waitlistRouter.get('/mine', protectUser, getMyWaitlist);

/**
 * @openapi
 * /waitlist/{entryId}/status:
 *   get:
 *     summary: Get the status of a single waitlist entry
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the entry). Used by the emailed claim page to show context and a countdown before claiming."
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Waitlist entry status
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
waitlistRouter.get('/:entryId/status', protectUser, getWaitlistEntryStatus);

/**
 * @openapi
 * /waitlist/{entryId}/claim:
 *   post:
 *     summary: Claim an offered seat from the waitlist and start checkout
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the entry). Only valid while the entry's offer is active and unexpired. Creates a normal Booking + Stripe checkout session for the single offered seat."
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seat claimed, Stripe checkout URL returned
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://checkout.stripe.com/c/pay/cs_test_..."
 *               bookingId: "66f7c0f1e1b1c8a1b8f1e1b4"
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
waitlistRouter.post('/:entryId/claim', protectUser, claimWaitlistOffer);

export default waitlistRouter;
