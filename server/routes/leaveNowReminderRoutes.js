import express from 'express';
import { optInToLeaveNowReminder } from '../controllers/leaveNowReminderController.js';
import { protectUser } from '../middleware/auth.js';

const leaveNowReminderRouter = express.Router();

/**
 * @openapi
 * /leave-now-reminder/{bookingId}/opt-in:
 *   post:
 *     summary: Opt in to a traffic-aware "leave now" reminder for an upcoming booking
 *     tags: [LeaveNowReminder]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user (must own the booking). lat/lng are used once, immediately,
 *       to estimate travel time and schedule the reminder — they are never persisted.
 *       If the estimate can't be computed (no API key configured, API failure, or the
 *       user never opts in), the existing fixed 8-hours-before reminder still applies
 *       unchanged. Best-effort estimate — does not account for last-minute traffic
 *       changes after scheduling.
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
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number, example: 37.7749 }
 *               lng: { type: number, example: -122.4194 }
 *     responses:
 *       200:
 *         description: Opted in, reminder scheduling started
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
leaveNowReminderRouter.post('/:bookingId/opt-in', protectUser, optInToLeaveNowReminder);

export default leaveNowReminderRouter;
