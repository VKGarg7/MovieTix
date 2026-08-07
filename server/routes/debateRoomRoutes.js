import express from 'express';
import { getDebateRoom, postDebateRoomMessage } from '../controllers/debateRoomController.js';
import { protectUser } from '../middleware/auth.js';

const debateRoomRouter = express.Router();

/**
 * @openapi
 * /debate-room/{showId}:
 *   get:
 *     summary: Get (or lazily open) the post-show debate room for a specific showing
 *     tags: [DebateRoom]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: signed-in user with a paid booking for this exact show. The room opens once
 *       showDateTime has passed and auto-closes (read-only) 24 hours later. Users without a
 *       paid booking for this show get a 403 explaining they need to have watched it.
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Debate room messages and status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               showId: "64f..."
 *               status: "active"
 *               expiresAt: "2026-05-02T18:00:00.000Z"
 *               messages: [{ _id: "...", userId: "user_1", name: "Alex", text: "That ending!", createdAt: "..." }]
 *       400:
 *         description: The show hasn't started yet
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         description: Caller has no paid booking for this show
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
debateRoomRouter.get('/:showId', protectUser, getDebateRoom);

/**
 * @openapi
 * /debate-room/{showId}/messages:
 *   post:
 *     summary: Post a message to a show's post-show debate room
 *     tags: [DebateRoom]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user with a paid booking for this show. Fails once the room has closed."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "That twist ending was unreal." }
 *     responses:
 *       200:
 *         description: Message posted, updated room returned
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         description: Caller has no paid booking for this show
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
debateRoomRouter.post('/:showId/messages', protectUser, postDebateRoomMessage);

export default debateRoomRouter;
