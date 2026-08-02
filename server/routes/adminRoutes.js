import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../controllers/adminController.js';

const adminRouter = express.Router();

/**
 * @openapi
 * /admin/is-admin:
 *   get:
 *     summary: Check whether the authenticated user is an admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only (super-admin or theater-admin). (protectAdmin already rejects non-admins with 403, so a 200 response always means true.)"
 *     responses:
 *       200:
 *         description: Confirmation of admin status, plus the caller's specific role
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               isAdmin: true
 *               role: theaterAdmin
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/is-admin', protectAdmin ,isAdmin);

/**
 * @openapi
 * /admin/dashboard-data:
 *   get:
 *     summary: Get aggregate dashboard stats (bookings, revenue, active shows, user count)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only. A theater-admin's totals are scoped to their own theater;
 *       totalUser is only populated for super-admins (null otherwise, since users
 *       aren't theater-scoped).
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               dashboardData:
 *                 totalBookings: 42
 *                 totalRevenue: 10500
 *                 activeShows: []
 *                 totalUser: 17
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/dashboard-data', protectAdmin , getDashboardData);

/**
 * @openapi
 * /admin/all-shows:
 *   get:
 *     summary: List all upcoming shows (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only. A theater-admin only sees shows at their own theater; super-admins see all."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Upcoming shows
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               shows: [{ _id: "abc123", showDateTime: "2026-08-01T14:00:00+05:30", showPrice: 250 }]
 *               pageInfo: { page: 1, limit: 20, total: 42, totalPages: 3 }
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/all-shows', protectAdmin ,getAllShows);

/**
 * @openapi
 * /admin/all-bookings:
 *   get:
 *     summary: List all paid bookings (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: admin only. A theater-admin only sees bookings for shows at their own theater; super-admins see all."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paid bookings
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               bookings: [{ _id: "def456", amount: 500, isPaid: true }]
 *               pageInfo: { page: 1, limit: 20, total: 42, totalPages: 3 }
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/all-bookings', protectAdmin , getAllBookings);

export default adminRouter;
