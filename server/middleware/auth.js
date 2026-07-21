import { clerkClient } from '@clerk/express';
import AppError from '../utils/AppError.js';

// requires a signed-in user
export const protectUser = (req, res, next) => {
    const { userId } = req.auth();

    if (!userId) {
        return next(new AppError('Not authenticated', 401, 'UNAUTHENTICATED'));
    }

    next();
}

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        if(user.privateMetadata.role !== 'admin'){
            return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
        }

        next();

    } catch (error) {
        req.log?.warn({ err: error }, 'Failed to verify admin role');
        next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
    }
}
