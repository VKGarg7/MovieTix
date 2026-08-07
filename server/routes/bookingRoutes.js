import express from 'express';
import { createBooking, getBookingStatus, getOccupiedSeats, cancelBooking, getBookingCalendar, getBookingPickupQr, verifyBookingPickup, getBookingWalletLink } from '../controllers/bookingController.js';
import { protectUser, protectAdmin } from '../middleware/auth.js';
import { seatPollingLimiter } from '../middleware/rateLimit.js';

const bookingRouter = express.Router();

/**
 * @openapi
 * /booking/create:
 *   post:
 *     summary: Reserve seats for a show and create a Stripe checkout session
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId, selectedSeats]
 *             properties:
 *               showId: { type: string, example: "60f7c0f1e1b1c8a1b8f1e1b1" }
 *               selectedSeats:
 *                 type: array
 *                 items: { type: string, example: "A1" }
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Booking created, Stripe checkout URL returned
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
bookingRouter.post('/create', protectUser, createBooking);

/**
 * @openapi
 * /booking/seats/{showId}:
 *   get:
 *     summary: Get currently occupied seats for a show
 *     tags: [Booking]
 *     description: "Auth: none (public). Rate limited per IP — this is the most scrapable route, so it has a stricter limit than other public endpoints."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of occupied seat labels
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               occupiedSeats: ["A1", "A2", "B5"]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
bookingRouter.get('/seats/:showId', seatPollingLimiter, getOccupiedSeats);

/**
 * @openapi
 * /booking/status/{bookingId}:
 *   get:
 *     summary: Get the payment status of a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking)."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               isPaid: true
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
bookingRouter.get('/status/:bookingId', protectUser, getBookingStatus);

/**
 * @openapi
 * /booking/cancel/{bookingId}:
 *   post:
 *     summary: Cancel a paid booking, refund via Stripe, and release the seats
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking). Must be at least the theater's cancellation cutoff (default 2 hours) before the showtime."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking cancelled and refund initiated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Booking cancelled and refund initiated"
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
bookingRouter.post('/cancel/:bookingId', protectUser, cancelBooking);

/**
 * @openapi
 * /booking/calendar/{bookingId}:
 *   get:
 *     summary: Download an .ics calendar event for a paid booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking). Only available for paid bookings. Event start/end are computed from the show's showDateTime and the movie's runtime (falls back to 2 hours if runtime is missing)."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: .ics file
 *         content:
 *           text/calendar: {}
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
bookingRouter.get('/calendar/:bookingId', protectUser, getBookingCalendar);

/**
 * @openapi
 * /booking/wallet/google/{bookingId}:
 *   get:
 *     summary: Get a "Save to Google Wallet" link for a paid booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user (must own the booking). Only available for paid bookings, and
 *       only when the server has Google Wallet credentials configured (GOOGLE_WALLET_ISSUER_ID,
 *       GOOGLE_WALLET_SERVICE_ACCOUNT) — returns 503 otherwise. The pass shows the same
 *       signed QR code used for in-app/at-door verification.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Save-to-wallet URL
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               saveUrl: "https://pay.google.com/gp/v/save/<jwt>"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       502:
 *         description: Google Wallet API call failed
 *       503:
 *         description: Google Wallet is not configured on this server
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
bookingRouter.get('/wallet/google/:bookingId', protectUser, getBookingWalletLink);

/**
 * @openapi
 * /booking/pickup-qr/{bookingId}:
 *   get:
 *     summary: Get a concession pickup QR code (PNG) for a paid booking with a snack pre-order
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must own the booking). Encodes a signed pickup token, not the raw booking ID."
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PNG QR code image
 *         content:
 *           image/png: {}
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
bookingRouter.get('/pickup-qr/:bookingId', protectUser, getBookingPickupQr);

/**
 * @openapi
 * /booking/verify-pickup:
 *   post:
 *     summary: Verify and redeem a concession pickup QR token at the counter
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only (theater-admin scoped to their own theater, or super-admin). Rejects tampered/forged tokens and double-redemption."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string, description: "Raw string decoded from the scanned QR code" }
 *     responses:
 *       200:
 *         description: Pickup confirmed
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
bookingRouter.post('/verify-pickup', protectAdmin, verifyBookingPickup);

export default bookingRouter;
