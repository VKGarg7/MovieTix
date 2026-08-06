import express from 'express';
import {
    createGroupBooking,
    claimGroupSeats,
    getGroupBookingStatus,
    getGroupBookingManageStatus,
    getMyGroupBookings,
    cancelGroupBooking,
    giftTicket,
} from '../controllers/groupBookingController.js';
import { protectUser } from '../middleware/auth.js';
import { groupStatusPollingLimiter } from '../middleware/rateLimit.js';

const groupBookingRouter = express.Router();

/**
 * @openapi
 * /group-booking/create:
 *   post:
 *     summary: Reserve a block of seats and generate a shareable group-booking link
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (becomes the organizer). Seats are atomically locked in the show's occupiedSeats, same mechanism as a normal booking."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId, seatBlock]
 *             properties:
 *               showId: { type: string, example: "60f7c0f1e1b1c8a1b8f1e1b1" }
 *               seatBlock:
 *                 type: array
 *                 items: { type: string, example: "A1" }
 *                 maxItems: 30
 *               expiresInHours: { type: integer, example: 24, description: "Defaults to 24, max 72." }
 *               organizerNote: { type: string, example: "Friday night watch party!" }
 *     responses:
 *       200:
 *         description: Group booking created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               groupId: "66f7c0f1e1b1c8a1b8f1e1b1"
 *               shareUrl: "https://movietix.example.com/group-booking/66f7c0f1e1b1c8a1b8f1e1b1"
 *               expiresAt: "2026-08-04T12:00:00.000Z"
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
groupBookingRouter.post('/create', protectUser, createGroupBooking);

/**
 * @openapi
 * /group-booking/gift:
 *   post:
 *     summary: Gift a specific show's ticket to a recipient by email
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (becomes the purchaser). Reserves a single seat as a size-1 group booking and emails the recipient a claim link — reuses the same seat-hold/claim/expiry mechanism as a normal watch-party group booking. The recipient picks/confirms their own seat via the standard /group-booking/{groupId}/claim flow, and an unclaimed seat is released back to availability at expiry."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId, seat, recipientEmail]
 *             properties:
 *               showId: { type: string, example: "60f7c0f1e1b1c8a1b8f1e1b1" }
 *               seat: { type: string, example: "A1" }
 *               recipientEmail: { type: string, example: "friend@example.com" }
 *               message: { type: string, example: "Happy birthday! Enjoy the show." }
 *               expiresInHours: { type: integer, example: 72, description: "Defaults to 24, max 72." }
 *     responses:
 *       200:
 *         description: Ticket gifted, claim link emailed to the recipient
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               groupId: "66f7c0f1e1b1c8a1b8f1e1b1"
 *               shareUrl: "https://movietix.example.com/group-booking/66f7c0f1e1b1c8a1b8f1e1b1"
 *               expiresAt: "2026-08-09T12:00:00.000Z"
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
groupBookingRouter.post('/gift', protectUser, giftTicket);

/**
 * @openapi
 * /group-booking/mine:
 *   get:
 *     summary: List group bookings organized by the authenticated user
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns group bookings where the user is the organizer, newest first."
 *     responses:
 *       200:
 *         description: The user's group bookings
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
groupBookingRouter.get('/mine', protectUser, getMyGroupBookings);

/**
 * @openapi
 * /group-booking/{groupId}/status:
 *   get:
 *     summary: Get the public claim status of a group booking
 *     tags: [GroupBooking]
 *     description: "Auth: none (public). Rate limited. Minimal payload safe to show to any invitee before sign-in — does not expose claimant identities."
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group booking status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
groupBookingRouter.get('/:groupId/status', groupStatusPollingLimiter, getGroupBookingStatus);

/**
 * @openapi
 * /group-booking/{groupId}/manage:
 *   get:
 *     summary: Get the organizer's detailed claim status for a group booking
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the organizer). Rate limited. Includes claimant identities and booking references, intended for polling."
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group booking management status
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
groupBookingRouter.get('/:groupId/manage', protectUser, groupStatusPollingLimiter, getGroupBookingManageStatus);

/**
 * @openapi
 * /group-booking/{groupId}/claim:
 *   post:
 *     summary: Claim one or more unclaimed seats from a group booking and start your own checkout
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Atomically claims the requested seats (all-or-nothing) then creates a normal Booking + Stripe checkout session for just the claimant's seats."
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selectedSeats]
 *             properties:
 *               selectedSeats:
 *                 type: array
 *                 items: { type: string, example: "A1" }
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Seats claimed, Stripe checkout URL returned
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://checkout.stripe.com/c/pay/cs_test_..."
 *               bookingId: "66f7c0f1e1b1c8a1b8f1e1b2"
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
groupBookingRouter.post('/:groupId/claim', protectUser, claimGroupSeats);

/**
 * @openapi
 * /group-booking/{groupId}/cancel:
 *   post:
 *     summary: Cancel a group booking, refunding any paid claims and releasing all block seats
 *     tags: [GroupBooking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the organizer). Refunds each paid claim independently; a failed refund marks that claim's booking pending-cancellation for manual review but does not block the rest."
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group booking cancelled
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
groupBookingRouter.post('/:groupId/cancel', protectUser, cancelGroupBooking);

export default groupBookingRouter;
