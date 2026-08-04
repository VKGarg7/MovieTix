import AuditLog from '../models/AuditLog.js';

export const recordAudit = async ({ req, action, entityType, entityId, diff }) => {
    try {
        const { userId } = req.auth();
        await AuditLog.create({
            actorId: userId,
            actorRole: req.adminContext.role,
            action,
            entityType,
            entityId: entityId.toString(),
            diff,
        });
    } catch (error) {
        req.log?.error({ err: error, action, entityType, entityId }, 'Failed to record audit log entry');
    }
};
