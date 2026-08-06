import express from 'express';
import {
    markOpenSlot,
    getOpenSlotsForAdmin,
    cancelOpenSlot,
    browseOpenSlots,
    submitScreeningRequest,
    getMyScreeningRequests,
    withdrawScreeningRequest,
    getScreeningRequestsForAdmin,
    approveScreeningRequest,
    rejectScreeningRequest,
} from '../controllers/communityScreeningController.js';
import { protectUser, protectAdmin } from '../middleware/auth.js';

const communityScreeningRouter = express.Router();

/**
 * @openapi
 * /community-screening/slots:
 *   post:
 *     summary: Mark an off-peak screen slot as open for community screening requests
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only. Theater-admins are scoped to their own theater's screens. Nothing bookable exists publicly until a request against this slot is approved."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [screenId, proposedDateTime, basePrice]
 *             properties:
 *               screenId: { type: string }
 *               proposedDateTime: { type: string, format: date-time }
 *               basePrice: { type: number, example: 150 }
 *               revenueSplitPercent: { type: number, example: 70, description: "Host's share, 0-100. Defaults to 70." }
 *               notes: { type: string }
 *               theaterId: { type: string, description: "Super-admin only." }
 *     responses:
 *       200:
 *         description: Open slot created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.post('/slots', protectAdmin, markOpenSlot);

/**
 * @openapi
 * /community-screening/slots/admin:
 *   get:
 *     summary: List open slots (admin view, all statuses)
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only, theater-scoped for theater-admins."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Open slots
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.get('/slots/admin', protectAdmin, getOpenSlotsForAdmin);

/**
 * @openapi
 * /community-screening/slots/{slotId}:
 *   delete:
 *     summary: Cancel an open slot (only if still unclaimed)
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only, theater-scoped for theater-admins."
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Slot cancelled
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.delete('/slots/:slotId', protectAdmin, cancelOpenSlot);

/**
 * @openapi
 * /community-screening/slots:
 *   get:
 *     summary: Browse open slots available for a screening request
 *     tags: [CommunityScreening]
 *     description: "Auth: none (public browse)."
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Open slots
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.get('/slots', browseOpenSlots);

/**
 * @openapi
 * /community-screening/requests:
 *   post:
 *     summary: Submit a screening request for an open slot
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in, verified and eligible community host only."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [openSlotId, filmTitle, filmRuntimeMinutes, expectedDraw]
 *             properties:
 *               openSlotId: { type: string }
 *               filmTitle: { type: string, example: "Echoes of the Delta" }
 *               filmDescription: { type: string }
 *               filmRuntimeMinutes: { type: integer, example: 94 }
 *               expectedDraw: { type: integer, example: 40 }
 *               contactNote: { type: string }
 *     responses:
 *       200:
 *         description: Request submitted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.post('/requests', protectUser, submitScreeningRequest);

/**
 * @openapi
 * /community-screening/requests/mine:
 *   get:
 *     summary: List screening requests submitted by the authenticated host
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: The user's screening requests
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.get('/requests/mine', protectUser, getMyScreeningRequests);

/**
 * @openapi
 * /community-screening/requests/{requestId}/withdraw:
 *   post:
 *     summary: Withdraw a pending screening request
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the requester). Only pending requests can be withdrawn."
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Request withdrawn
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.post('/requests/:requestId/withdraw', protectUser, withdrawScreeningRequest);

/**
 * @openapi
 * /community-screening/requests/admin:
 *   get:
 *     summary: List screening requests for review (admin view)
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only, theater-scoped for theater-admins."
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, withdrawn] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Screening requests
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.get('/requests/admin', protectAdmin, getScreeningRequestsForAdmin);

/**
 * @openapi
 * /community-screening/requests/{requestId}/approve:
 *   post:
 *     summary: Approve a screening request, creating a normal bookable Show attributed to the host
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only, theater-scoped for theater-admins. Creates a Show with
 *       communityHostId and revenueSplitPercent set, immediately visible in the normal
 *       browse/booking flow like any other show.
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Request approved, Show created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               showId: "66f7c0f1e1b1c8a1b8f1e1b1"
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
communityScreeningRouter.post('/requests/:requestId/approve', protectAdmin, approveScreeningRequest);

/**
 * @openapi
 * /community-screening/requests/{requestId}/reject:
 *   post:
 *     summary: Reject a screening request
 *     tags: [CommunityScreening]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only, theater-scoped for theater-admins."
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Request rejected
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityScreeningRouter.post('/requests/:requestId/reject', protectAdmin, rejectScreeningRequest);

export default communityScreeningRouter;
