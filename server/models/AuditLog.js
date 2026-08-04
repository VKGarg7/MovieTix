import mongoose from "mongoose";

const ENTITY_TYPES = ['Show', 'Theater', 'Screen'];
const ACTIONS = ['create', 'update', 'delete'];

const auditLogSchema = new mongoose.Schema(
    {
        actorId: { type: String, required: true },
        actorRole: { type: String, required: true, enum: ['superAdmin', 'theaterAdmin'] },
        action: { type: String, required: true, enum: ACTIONS },
        entityType: { type: String, required: true, enum: ENTITY_TYPES },
        entityId: { type: String, required: true },
        diff: { type: Object, default: {} },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AUDIT_ENTITY_TYPES = ENTITY_TYPES;
export const AUDIT_ACTIONS = ACTIONS;

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
