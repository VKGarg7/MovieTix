import express from 'express';
import { protectUser, protectAdmin, requireSuperAdmin } from '../middleware/auth.js';
import {
    validateCoupon,
    createCoupon,
    updateCoupon,
    deactivateCoupon,
    getAllCoupons,
} from '../controllers/couponController.js';

const couponRouter = express.Router();

couponRouter.post('/validate', protectUser, validateCoupon);

couponRouter.get('/', protectAdmin, requireSuperAdmin, getAllCoupons);
couponRouter.post('/', protectAdmin, requireSuperAdmin, createCoupon);
couponRouter.put('/:couponId', protectAdmin, requireSuperAdmin, updateCoupon);
couponRouter.delete('/:couponId', protectAdmin, requireSuperAdmin, deactivateCoupon);

export default couponRouter;
