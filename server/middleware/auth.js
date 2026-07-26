import { clerkClient } from '@clerk/express';
import mongoose from 'mongoose';
import Theater from '../models/Theater.js';
import AppError from '../utils/AppError.js';

const ADMIN_ROLES = ['superAdmin', 'theaterAdmin'];

// requires a signed-in user
export const protectUser = (req, res, next) => {
    const { userId } = req.auth();

    if (!userId) {
        return next(new AppError('Not authenticated', 401, 'UNAUTHENTICATED'));
    }

    next();
}

// Allows superAdmin (unrestricted) and theaterAdmin (scoped to their own
// theater) through; rejects everyone else. Resolves req.adminContext =
// { role, theaterId } so downstream controllers can scope their queries
// without re-fetching the Clerk user themselves.
export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);
        const { role, theaterId } = user.privateMetadata || {};

        if (!ADMIN_ROLES.includes(role)) {
            return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
        }

        if (role === 'theaterAdmin') {
            if (!theaterId || !mongoose.Types.ObjectId.isValid(theaterId)) {
                req.log?.warn({ userId, theaterId }, 'theaterAdmin has no valid theaterId assigned');
                return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
            }

            // A deleted/deactivated theater must deny access gracefully, not throw.
            const theater = await Theater.findById(theaterId);
            if (!theater || !theater.isActive) {
                req.log?.warn({ userId, theaterId }, 'theaterAdmin theater is missing or inactive');
                return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
            }
        }

        req.adminContext = { role, theaterId: role === 'theaterAdmin' ? theaterId : null };

        next();

    } catch (error) {
        req.log?.warn({ err: error }, 'Failed to verify admin role');
        next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
    }
}

// For actions that only make sense at the platform level (creating theaters,
// creating screens under an arbitrary theater). Must run after protectAdmin.
export const requireSuperAdmin = (req, res, next) => {
    if (req.adminContext?.role !== 'superAdmin') {
        return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
    }
    next();
}
