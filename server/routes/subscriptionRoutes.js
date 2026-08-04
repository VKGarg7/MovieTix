import express from 'express';
import {
    subscribeToBingePass,
    getBingePassStatus,
    getBingePassManageUrl,
    checkBingePassEligibility,
} from '../controllers/subscriptionController.js';
import { protectUser } from '../middleware/auth.js';

const subscriptionRouter = express.Router();

/**
 * @openapi
 * /subscription/binge-pass:
 *   post:
 *     summary: Subscribe to the Binge Pass tier via Stripe Billing
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns a Stripe Checkout session URL in subscription mode. User must not already have an active subscription."
 *     responses:
 *       200:
 *         description: Checkout session URL for the subscription
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://checkout.stripe.com/c/pay/cs_test_..."
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
subscriptionRouter.post('/binge-pass', protectUser, subscribeToBingePass);

/**
 * @openapi
 * /subscription/binge-pass/status:
 *   get:
 *     summary: Get the user's Binge Pass subscription status and remaining credits
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               subscribed: true
 *               plan: "binge_pass_monthly"
 *               creditsRemaining: 3
 *               creditsPerCycle: 4
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
subscriptionRouter.get('/binge-pass/status', protectUser, getBingePassStatus);

/**
 * @openapi
 * /subscription/binge-pass/manage:
 *   get:
 *     summary: Open Stripe's customer portal to manage/cancel the subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns a Stripe customer portal session URL."
 *     responses:
 *       200:
 *         description: Customer portal session URL
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://billing.stripe.com/p/session/..."
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
subscriptionRouter.get('/binge-pass/manage', protectUser, getBingePassManageUrl);

/**
 * @openapi
 * /subscription/binge-pass/eligibility/{showId}:
 *   get:
 *     summary: Check whether a Binge Pass credit can be used for a show
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Returns whether the show is eligible (respects peak/premium exclusions) and remaining credits."
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eligibility status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               eligible: true
 *               creditsRemaining: 3
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
subscriptionRouter.get('/binge-pass/eligibility/:showId', protectUser, checkBingePassEligibility);

export default subscriptionRouter;