import express from 'express';
import {
    initiateDirectTransfer,
    listTicketForResale,
    cancelTicketTransfer,
    browseResaleListings,
    getMyTicketTransfers,
    getTicketTransferStatus,
    claimDirectTransfer,
    claimResaleListing,
} from '../controllers/ticketTransferController.js';
import { protectUser } from '../middleware/auth.js';
import { groupStatusPollingLimiter } from '../middleware/rateLimit.js';

const ticketTransferRouter = express.Router();

/**
 * @openapi
 * /ticket-transfer/{bookingId}/transfer:
 *   post:
 *     summary: Transfer a specific booking directly to a named recipient
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking). No payment involved. Blocked within 30 minutes of showtime. The original owner's QR/pickup code is invalidated the moment the transfer is initiated."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail]
 *             properties:
 *               recipientEmail: { type: string, example: "friend@example.com" }
 *     responses:
 *       200:
 *         description: Transfer initiated, claim link emailed to the recipient
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.post('/:bookingId/transfer', protectUser, initiateDirectTransfer);

/**
 * @openapi
 * /ticket-transfer/{bookingId}/resell:
 *   post:
 *     summary: List a booking for resale to any user browsing that show
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking). resalePrice is capped server-side at the booking's original amount paid — never allowed to exceed it, to keep this a convenience feature rather than a scalping vector. Blocked within 30 minutes of showtime."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resalePrice]
 *             properties:
 *               resalePrice: { type: number, example: 15 }
 *     responses:
 *       200:
 *         description: Ticket listed for resale
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.post('/:bookingId/resell', protectUser, listTicketForResale);

/**
 * @openapi
 * /ticket-transfer/{transferId}/cancel:
 *   post:
 *     summary: Cancel a pending direct transfer or resale listing
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the seller). Only pending transfers/listings can be cancelled."
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transfer/listing cancelled
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.post('/:transferId/cancel', protectUser, cancelTicketTransfer);

/**
 * @openapi
 * /ticket-transfer/resale:
 *   get:
 *     summary: Browse open resale listings, optionally filtered to one show
 *     tags: [TicketTransfer]
 *     description: "Auth: none (public browse)."
 *     parameters:
 *       - in: query
 *         name: showId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Open resale listings
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.get('/resale', browseResaleListings);

/**
 * @openapi
 * /ticket-transfer/{transferId}/status:
 *   get:
 *     summary: Get the public status of a transfer/listing (for the claim page before sign-in)
 *     tags: [TicketTransfer]
 *     description: "Auth: none (public). Rate limited. Minimal payload — no personal info about the seller."
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transfer/listing status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.get('/:transferId/status', groupStatusPollingLimiter, getTicketTransferStatus);

/**
 * @openapi
 * /ticket-transfer/mine:
 *   get:
 *     summary: List transfers/resale listings created by the authenticated user
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: The user's transfers/listings
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
ticketTransferRouter.get('/mine', protectUser, getMyTicketTransfers);

/**
 * @openapi
 * /ticket-transfer/{transferId}/claim-direct:
 *   post:
 *     summary: Claim a directly-transferred ticket
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. No payment involved — immediately reassigns the booking and issues a new ticket code."
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket claimed
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
ticketTransferRouter.post('/:transferId/claim-direct', protectUser, claimDirectTransfer);

/**
 * @openapi
 * /ticket-transfer/{transferId}/claim-resale:
 *   post:
 *     summary: Buy a resale-listed ticket
 *     tags: [TicketTransfer]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Starts a Stripe checkout at the listed resalePrice; the booking is reassigned and the seller paid out (as account credit) once payment is confirmed via webhook."
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Checkout started
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://checkout.stripe.com/c/pay/cs_test_..."
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
ticketTransferRouter.post('/:transferId/claim-resale', protectUser, claimResaleListing);

export default ticketTransferRouter;
