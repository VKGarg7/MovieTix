import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import DebateRoom from '../models/DebateRoom.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { CANCELLED_STATUSES } from './userController.js';

const DEBATE_ROOM_WINDOW_HOURS = 24;
const MAX_MESSAGE_LENGTH = 2000;

const userHasPaidBookingForShow = async (userId, showId) =>
    Boolean(await Booking.exists({ user: userId, show: showId, isPaid: true, status: { $nin: CANCELLED_STATUSES } }));

const getOrCreateDebateRoom = async (showId) => {
    let room = await DebateRoom.findOne({ show: showId });
    if (room) return room;

    const show = await Show.findById(showId);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }
    if (show.showDateTime.getTime() > Date.now()) {
        throw new AppError('The debate room opens once this showing has started', 400, 'ROOM_NOT_YET_OPEN');
    }

    const expiresAt = new Date(show.showDateTime.getTime() + DEBATE_ROOM_WINDOW_HOURS * 60 * 60 * 1000);

    try {
        room = await DebateRoom.create({ show: showId, expiresAt });
    } catch (error) {
        if (error.code === 11000) {
            room = await DebateRoom.findOne({ show: showId });
        } else {
            throw error;
        }
    }

    await inngest.send({
        name: 'app/debate-room.expire',
        data: { roomId: room._id.toString(), expiresAt: expiresAt.toISOString() },
    });

    return room;
};

const serializeRoom = async (room) => {
    const userIds = [...new Set(room.messages.map(m => m.userId))];
    const users = await User.find({ _id: { $in: userIds } }, { name: 1 });
    const userById = new Map(users.map(u => [u._id, u]));

    return {
        showId: room.show,
        status: room.status,
        expiresAt: room.expiresAt,
        messages: room.messages.map(m => ({
            _id: m._id,
            userId: m.userId,
            name: userById.get(m.userId)?.name || 'A viewer',
            text: m.text,
            createdAt: m.createdAt,
        })),
    };
};

const assertEligible = async (userId, showId) => {
    const eligible = await userHasPaidBookingForShow(userId, showId);
    if (!eligible) {
        throw new AppError('You need to have watched this showing to join its debate room', 403, 'NOT_ELIGIBLE_FOR_DEBATE_ROOM');
    }
};

export const getDebateRoom = asyncHandler(async (req, res) => {
    const { showId } = req.params;
    const { userId } = req.auth();

    await assertEligible(userId, showId);
    const room = await getOrCreateDebateRoom(showId);

    res.json({ success: true, ...(await serializeRoom(room)) });
});

export const postDebateRoomMessage = asyncHandler(async (req, res) => {
    const { showId } = req.params;
    const { userId } = req.auth();
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
        throw new AppError('text is required', 400, 'INVALID_INPUT');
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
        throw new AppError(`text must be ${MAX_MESSAGE_LENGTH} characters or fewer`, 400, 'INVALID_INPUT');
    }

    await assertEligible(userId, showId);

    const room = await getOrCreateDebateRoom(showId);
    if (room.status !== 'active') {
        throw new AppError('This debate room has closed', 400, 'ROOM_CLOSED');
    }

    const updated = await DebateRoom.findOneAndUpdate(
        { _id: room._id, status: 'active' },
        { $push: { messages: { userId, text: text.trim() } } },
        { new: true }
    );
    if (!updated) {
        throw new AppError('This debate room has closed', 400, 'ROOM_CLOSED');
    }

    req.log.info({ showId, userId }, 'Debate room message posted');
    res.json({ success: true, ...(await serializeRoom(updated)) });
});
