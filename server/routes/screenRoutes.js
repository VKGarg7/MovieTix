import express from 'express';
import { protectAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { createScreen, getScreens, updateScreen } from '../controllers/screenController.js';

const screenRouter = express.Router();

/**
 * @openapi
 * /screen:
 *   get:
 *     summary: List screens, optionally filtered by theater
 *     tags: [Screen]
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *         description: Filter to screens belonging to this theater
 *     responses:
 *       200:
 *         description: Screens matching the filter
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               screens: [{ _id: "abc123", name: "Screen 1", totalCapacity: 90 }]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
screenRouter.get('/', getScreens);

/**
 * @openapi
 * /screen:
 *   post:
 *     summary: Create a screen with a seat-row layout under a theater
 *     tags: [Screen]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: super-admin only."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             theaterId: "abc123"
 *             name: "Screen 1"
 *             rows:
 *               - { label: "A", seatCount: 9, seatType: "regular" }
 *               - { label: "B", seatCount: 9, seatType: "regular" }
 *               - { label: "C", seatCount: 6, seatType: "premium" }
 *     responses:
 *       201:
 *         description: Screen created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               screen: { _id: "abc123", name: "Screen 1", totalCapacity: 24 }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Theater not found
 *       409:
 *         description: A screen with this name already exists in this theater
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
screenRouter.post('/', protectAdmin, requireSuperAdmin, createScreen);

/**
 * @openapi
 * /screen/{screenId}:
 *   patch:
 *     summary: Update a screen's name and/or seat-row layout
 *     tags: [Screen]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only (theater-admins may only edit screens belonging to their own theater; 403 otherwise).
 *       Editing rows is blocked (409) if the screen has any upcoming show,
 *       since changing seat counts/types would invalidate already-sold seat IDs.
 *     parameters:
 *       - in: path
 *         name: screenId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Screen 1 (Renamed)"
 *             rows:
 *               - { label: "A", seatCount: 9, seatType: "regular" }
 *     responses:
 *       200:
 *         description: Screen updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Screen not found
 *       409:
 *         description: Screen has upcoming shows; rows cannot be edited
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
screenRouter.patch('/:screenId', protectAdmin, updateScreen);

export default screenRouter;
