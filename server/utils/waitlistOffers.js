import Waitlist from '../models/Waitlist.js';
import { inngest } from '../inngest/index.js';
import { logger } from '../configs/logger.js';
import { occupySeatsIfFree } from './seatOperations.js';

export const CLAIM_WINDOW_MINUTES = parseInt(process.env.WAITLIST_CLAIM_WINDOW_MINUTES, 10) || 5;
export const WAITLIST_HOLD_SENTINEL_PREFIX = 'WAITLIST_HOLD:';

const offerOneSeat = async (showId, seat) => {
    const offerExpiresAt = new Date(Date.now() + CLAIM_WINDOW_MINUTES * 60 * 1000);

    const entry = await Waitlist.findOneAndUpdate(
        { showId, status: 'waiting' },
        { $set: { status: 'offered', offeredSeat: seat, offeredAt: new Date(), offerExpiresAt } },
        { sort: { joinedAt: 1 }, new: true }
    );
    if (!entry) return;

    const relocked = await occupySeatsIfFree(showId, seat, WAITLIST_HOLD_SENTINEL_PREFIX + entry._id);
    if (!relocked) {
        await Waitlist.updateOne(
            { _id: entry._id, status: 'offered' },
            { $set: { status: 'waiting', offeredSeat: null, offeredAt: null, offerExpiresAt: null } }
        );
        return;
    }

    await inngest.send({
        name: 'app/waitlist.offer',
        data: { waitlistEntryId: entry._id.toString(), showId, seat, offerExpiresAt: offerExpiresAt.toISOString() },
    });

    logger.info({ waitlistEntryId: entry._id.toString(), showId, seat }, 'Waitlist offer sent');
};

export const offerSeatsToWaitlist = async (showId, seats) => {
    if (!seats?.length) return;

    const hasWaiting = await Waitlist.exists({ showId: showId.toString(), status: 'waiting' });
    if (!hasWaiting) return;

    for (const seat of seats) {
        await offerOneSeat(showId.toString(), seat);
    }
};
