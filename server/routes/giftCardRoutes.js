import express from 'express';
import { purchaseGiftCard, validateGiftCard, getMyGiftCards } from '../controllers/giftCardController.js';
import { protectUser } from '../middleware/auth.js';

const giftCardRouter = express.Router();

/**
 * @openapi
 * /gift-card/purchase:
 *   post:
 *     summary: Purchase a monetary gift card for a recipient
 *     tags: [GiftCard]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user (becomes the purchaser). Creates the gift card immediately with a unique redemption code; balance is only usable once payment is confirmed via Stripe webhook, which also emails the code to the recipient."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, recipientEmail]
 *             properties:
 *               amount: { type: number, example: 50, description: "Between 5 and 500." }
 *               recipientEmail: { type: string, example: "friend@example.com" }
 *               message: { type: string, example: "Happy birthday! Go watch something great." }
 *     responses:
 *       200:
 *         description: Gift card created, Stripe checkout URL returned
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               url: "https://checkout.stripe.com/c/pay/cs_test_..."
 *               giftCardId: "66f7c0f1e1b1c8a1b8f1e1b1"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
giftCardRouter.post('/purchase', protectUser, purchaseGiftCard);

/**
 * @openapi
 * /gift-card/validate:
 *   post:
 *     summary: Check a gift card code's remaining balance before applying it at checkout
 *     tags: [GiftCard]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user. Read-only check, does not redeem any balance."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "AB12CD34EF" }
 *     responses:
 *       200:
 *         description: Gift card balance
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               balance: 50
 *               expiryDate: "2027-08-06T00:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
giftCardRouter.post('/validate', protectUser, validateGiftCard);

/**
 * @openapi
 * /gift-card/mine:
 *   get:
 *     summary: List gift cards purchased by the authenticated user
 *     tags: [GiftCard]
 *     security:
 *       - bearerAuth: []
 *     description: "Auth: signed-in user."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: The user's purchased gift cards
 *       401:
 *         $ref: '#/components/responses/Unauthenticated'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
giftCardRouter.get('/mine', protectUser, getMyGiftCards);

export default giftCardRouter;
