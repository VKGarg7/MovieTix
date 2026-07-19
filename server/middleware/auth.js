import { clerkClient } from '@clerk/express';

// requires a signed-in user
export const protectUser = (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({success: false, message: "not authenticated"});
        }

        next();

    } catch (error) {
        return res.status(401).json({success: false, message: "not authenticated"});
    }
}

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        if(user.privateMetadata.role !== 'admin'){
            return res.status(403).json({success: false , message: "not authorized"});
        }

        next();

    } catch (error) {
        return res.status(403).json({success: false, message: "not authorized"});
    }
}