import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    text: { type: String, required: true },
}, { timestamps: true });

const debateRoomSchema = new mongoose.Schema({
    show: { type: String, required: true, unique: true, ref: 'Show' },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

debateRoomSchema.index({ expiresAt: 1 });

const DebateRoom = mongoose.model('DebateRoom', debateRoomSchema);
export default DebateRoom;
