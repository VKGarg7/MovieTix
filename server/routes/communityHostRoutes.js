import express from 'express';
import {
    applyAsCommunityHost,
    getMyCommunityHostProfile,
    getAllCommunityHosts,
    verifyCommunityHost,
    revokeCommunityHostEligibility,
    reinstateCommunityHostEligibility,
} from '../controllers/communityHostController.js';
import { protectUser } from '../middleware/auth.js';
import { protectAdmin, requireSuperAdmin } from '../middleware/auth.js';

const communityHostRouter = express.Router();

/**
 * @openapi
 * /community-host/apply:
 *   post:
 *     summary: Apply to become a verified community host (filmmaker/film club)
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. One application per user. Starts unverified — a super-admin must verify before the user can submit screening requests."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationName]
 *             properties:
 *               organizationName: { type: string, example: "Riverside Film Collective" }
 *               description: { type: string, example: "Community-run indie screening group." }
 *     responses:
 *       200:
 *         description: Application submitted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.post('/apply', protectUser, applyAsCommunityHost);

/**
 * @openapi
 * /community-host/mine:
 *   get:
 *     summary: Get the authenticated user's community host profile, if any
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns host: null if the user has never applied."
 *     responses:
 *       200:
 *         description: Community host profile
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.get('/mine', protectUser, getMyCommunityHostProfile);

/**
 * @openapi
 * /community-host/all:
 *   get:
 *     summary: List all community host applications
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: super-admin only — host verification is a platform-wide trust decision, not theater-scoped."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Community host applications
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.get('/all', protectAdmin, requireSuperAdmin, getAllCommunityHosts);

/**
 * @openapi
 * /community-host/{hostId}/verify:
 *   post:
 *     summary: Verify a community host, allowing them to submit screening requests
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: super-admin only."
 *     parameters:
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Host verified
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.post('/:hostId/verify', protectAdmin, requireSuperAdmin, verifyCommunityHost);

/**
 * @openapi
 * /community-host/{hostId}/revoke:
 *   post:
 *     summary: Revoke a community host's future open-slot eligibility
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: super-admin only. Does not affect verified status or any Show already created
 *       from a past approved request — only blocks new screening requests going forward
 *       (e.g. a host who repeatedly fails to draw any bookings).
 *     parameters:
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "No bookings across 3 approved slots." }
 *     responses:
 *       200:
 *         description: Eligibility revoked
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.post('/:hostId/revoke', protectAdmin, requireSuperAdmin, revokeCommunityHostEligibility);

/**
 * @openapi
 * /community-host/{hostId}/reinstate:
 *   post:
 *     summary: Reinstate a previously revoked community host's eligibility
 *     tags: [CommunityHost]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: super-admin only."
 *     parameters:
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eligibility reinstated
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
communityHostRouter.post('/:hostId/reinstate', protectAdmin, requireSuperAdmin, reinstateCommunityHostEligibility);

export default communityHostRouter;
