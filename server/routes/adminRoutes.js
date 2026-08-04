import express from 'express';
import { protectAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { exportBookingsCsv, getAllBookings, getAllShows, getAuditLog, getDashboardAnalytics, getDashboardData, isAdmin } from '../controllers/adminController.js';
import { getAdminOccupancyPulse } from '../controllers/showController.js';

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
 * /admin/dashboard-analytics:
 *   get:
 *     summary: Get revenue trend, occupancy-by-show, and top-movies analytics for a date range
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only. A theater-admin's data is always scoped to their own theater.
 *       A super-admin sees all theaters by default, or a single theater via ?theaterId=.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start of date range (inclusive). Defaults to 30 days before `to`.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End of date range (inclusive). Defaults to today.
 *       - in: query
 *         name: theaterId
 *         schema: { type: string }
 *         description: Super-admin only. Restricts results to a single theater.
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               analytics:
 *                 range: { from: "2026-07-05T00:00:00.000Z", to: "2026-08-04T23:59:59.999Z" }
 *                 revenueTrend: [{ date: "2026-08-01", revenue: 5400, bookings: 12 }]
 *                 topMovies: [{ movieId: "abc123", title: "Dune", revenue: 12000, bookings: 30 }]
 *                 occupancyByShow: [{ _id: "show1", title: "Dune", showDateTime: "2026-08-01T14:00:00Z", totalCapacity: 100, occupiedCount: 80, occupancyPct: 80 }]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/dashboard-analytics', protectAdmin , getDashboardAnalytics);

/**
 * @openapi
 * /admin/occupancy-pulse:
 *   get:
 *     summary: Get live occupancy % for every upcoming show in the next 24 hours (ops view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only. A theater-admin's data is always scoped to their own theater.
 *       A super-admin sees all theaters by default, or a single theater via ?theaterId=.
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema: { type: string }
 *         description: Super-admin only. Restricts results to a single theater.
 *     responses:
 *       200:
 *         description: Live occupancy per upcoming show
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/occupancy-pulse', protectAdmin , getAdminOccupancyPulse);

/**
 * @openapi
 * /admin/export-bookings:
 *   get:
 *     summary: Export paid bookings as a CSV file, scoped by date range and theater
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: admin only. Same date-range/theater scoping rules as /admin/dashboard-analytics.
 *       Streams the response row-by-row rather than buffering the full CSV in memory,
 *       so exports of thousands of bookings do not spike server memory or time out.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start of date range (inclusive). Defaults to 30 days before `to`.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End of date range (inclusive). Defaults to today.
 *       - in: query
 *         name: theaterId
 *         schema: { type: string }
 *         description: Super-admin only. Restricts results to a single theater.
 *     responses:
 *       200:
 *         description: CSV file (text/csv) with a header row and one row per booking
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/export-bookings', protectAdmin , exportBookingsCsv);

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

/**
 * @openapi
 * /admin/audit-log:
 *   get:
 *     summary: List audit log entries recording admin mutations (show/theater/screen create/edit/delete)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth: super-admin only. Entries are immutable — there is no update or delete endpoint
 *       for this resource. Filterable by actor, entity type, and a created-at date range.
 *     parameters:
 *       - in: query
 *         name: actorId
 *         schema: { type: string }
 *         description: Filter to entries by this Clerk user id
 *       - in: query
 *         name: entityType
 *         schema: { type: string, enum: [Show, Theater, Screen] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start of date range (inclusive)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End of date range (inclusive)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Audit log entries
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               entries:
 *                 - _id: "abc123"
 *                   actorId: "user_2abc"
 *                   actorRole: superAdmin
 *                   action: create
 *                   entityType: Theater
 *                   entityId: "6a678a275ab31a05eee7c999"
 *                   diff: { after: { name: "PVR", city: "Noida" } }
 *                   createdAt: "2026-08-01T14:00:00.000Z"
 *               pageInfo: { page: 1, limit: 20, total: 42, totalPages: 3 }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminRouter.get('/audit-log', protectAdmin , requireSuperAdmin , getAuditLog);

export default adminRouter;
