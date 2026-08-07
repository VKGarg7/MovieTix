import express from 'express';
import {
    createMatchSession,
    getMatchSessionStatus,
    joinMatchSession,
    swipeOnMatchSession,
    closeMatchSession,
    getMyMatchSessions,
} from '../controllers/matchSessionController.js';
import { protectUser } from '../middleware/auth.js';
import { matchSessionLimiter } from '../middleware/rateLimit.js';

const matchSessionRouter = express.Router();

/**
 * @openapi
 * /match-session/create:
 *   post:
 *     summary: Start a Movie Match swipe session across candidate movies and generate a shareable join link
 *     tags: [MatchSession]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (becomes the host). Omit movieIds to default to currently-showing movies at theaterId."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitedCount]
 *             properties:
 *               movieIds:
 *                 type: array
 *                 items: { type: string }
 *               theaterId: { type: string, description: "Used to default candidates when movieIds is omitted." }
 *               invitedCount: { type: integer, example: 4 }
 *               expiresInHours: { type: integer, example: 48, description: "Defaults to 48, max 168." }
 *               organizerNote: { type: string, example: "Swipe on tonight's options!" }
 *     responses:
 *       200:
 *         description: Session created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
matchSessionRouter.post('/create', protectUser, createMatchSession);

/**
 * @openapi
 * /match-session/mine:
 *   get:
 *     summary: List Movie Match sessions hosted by the authenticated user
 *     tags: [MatchSession]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: The user's match sessions
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
matchSessionRouter.get('/mine', protectUser, getMyMatchSessions);

/**
 * @openapi
 * /match-session/{sessionId}/status:
 *   get:
 *     summary: Get the live swipe progress and result of a Movie Match session
 *     tags: [MatchSession]
 *     description: "Auth: none (public). Rate limited."
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
matchSessionRouter.get('/:sessionId/status', matchSessionLimiter, getMatchSessionStatus);

/**
 * @openapi
 * /match-session/{sessionId}/join:
 *   post:
 *     summary: Join a Movie Match session by name (no account required)
 *     tags: [MatchSession]
 *     description: "Auth: none (public, name-only). Rate limited."
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Alex" }
 *     responses:
 *       200:
 *         description: Joined session
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
matchSessionRouter.post('/:sessionId/join', matchSessionLimiter, joinMatchSession);

/**
 * @openapi
 * /match-session/{sessionId}/swipe:
 *   post:
 *     summary: Record a yes/no swipe on a candidate movie
 *     tags: [MatchSession]
 *     description: "Auth: none (public, name-only). Rate limited. Once every participant has swiped on every candidate, the session auto-closes with a match result."
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, movieId, yes]
 *             properties:
 *               name: { type: string, example: "Alex" }
 *               movieId: { type: string }
 *               yes: { type: boolean }
 *     responses:
 *       200:
 *         description: Swipe recorded
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
matchSessionRouter.post('/:sessionId/swipe', matchSessionLimiter, swipeOnMatchSession);

/**
 * @openapi
 * /match-session/{sessionId}/close:
 *   post:
 *     summary: Manually close a Movie Match session and compute the match result
 *     tags: [MatchSession]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (must be the host)."
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session closed with match result
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
matchSessionRouter.post('/:sessionId/close', protectUser, closeMatchSession);

export default matchSessionRouter;
