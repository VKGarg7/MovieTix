import express from 'express';
import { protectAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { createTheater, getTheaters } from '../controllers/theaterController.js';

const theaterRouter = express.Router();

/**
 * @openapi
 * /theater:
 *   get:
 *     summary: List theaters, optionally filtered by city
 *     tags: [Theater]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Case-insensitive exact city match
 *     responses:
 *       200:
 *         description: Theaters matching the filter
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               theaters: [{ _id: "abc123", name: "PVR", city: "Noida", slug: "pvr" }]
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
theaterRouter.get('/', getTheaters);

/**
 * @openapi
 * /theater:
 *   post:
 *     summary: Register a new theater
 *     tags: [Theater]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: super-admin only."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: PVR
 *             city: Noida
 *             address: DLF Mall of India, Sector 18
 *             geolocation: { lat: 28.5677, lng: 77.3219 }
 *             contactEmail: pvr.noida@example.com
 *             timezone: Asia/Kolkata
 *     responses:
 *       201:
 *         description: Theater created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               theater: { _id: "abc123", name: "PVR", city: "Noida", slug: "pvr" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: A theater with this name already exists in this city
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
theaterRouter.post('/', protectAdmin, requireSuperAdmin, createTheater);

export default theaterRouter;
