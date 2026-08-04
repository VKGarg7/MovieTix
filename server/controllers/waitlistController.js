import Show from '../models/Show.js';
import Waitlist from '../models/Waitlist.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { releaseSeatsAtomic, releaseSeatsAndNotifyWaitlist, getSeatCapacityInfo } from '../utils/seatOperations.js';
import { offerSeatsToWaitlist } from '../utils/waitlistOffers.js';
import { runBookingCheckout } from './bookingController.js';

const revertWaitlistClaim = (entry) => async (seats) => {
    if (Date.now() > new Date(entry.offerExpiresAt).getTime()) {
        await releaseSeatsAndNotifyWaitlist(entry.showId, seats);
        return;
    }
    await Waitlist.updateOne(
        { _id: entry._id, status: 'claimed' },
        { $set: { status: 'offered' } }
    );
};


export const joinWaitlist = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { showId } = req.body;

    if (!showId) {
        throw new AppError('showId is required', 400, 'INVALID_INPUT');
    }

    const show = await Show.findById(showId).populate('screen');
    if (!show || show.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }
    if (!getSeatCapacityInfo(show).isSoldOut) {
        throw new AppError('This show still has seats available', 400, 'NOT_SOLD_OUT');
    }

    let entry;
    try {
        entry = await Waitlist.create({ userId, showId, joinedAt: new Date() });
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError('You are already on the waitlist for this show', 409, 'ALREADY_ON_WAITLIST');
        }
        throw error;
    }

    const position = await Waitlist.countDocuments({
        showId,
        status: 'waiting',
        joinedAt: { $lte: entry.joinedAt },
    });

    req.log.info({ waitlistEntryId: entry._id.toString(), showId, userId, position }, 'User joined waitlist');
    res.json({ success: true, waitlistEntryId: entry._id, position });
});


export const leaveWaitlist = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { showId } = req.params;

    const entry = await Waitlist.findOneAndUpdate(
        { showId, userId, status: { $in: ['waiting', 'offered'] } },
        { $set: { status: 'left' } },
        { new: true }
    );
    if (!entry) {
        throw new AppError('No active waitlist entry found for this show', 404, 'WAITLIST_ENTRY_NOT_FOUND');
    }

    if (entry.offeredSeat) {
        await releaseSeatsAtomic(showId, [entry.offeredSeat]);
        await offerSeatsToWaitlist(showId, [entry.offeredSeat]);
    }

    req.log.info({ waitlistEntryId: entry._id.toString(), showId, userId }, 'User left waitlist');
    res.json({ success: true, message: 'Left the waitlist' });
});


export const getMyWaitlist = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const entries = await Waitlist.find({ userId, status: { $in: ['waiting', 'offered'] } })
        .sort({ createdAt: -1 })
        .populate({ path: 'showId', populate: [{ path: 'movie' }, SCREEN_WITH_THEATER] });

    const results = await Promise.all(entries.map(async (entry) => {
        const show = entry.showId;
        const base = {
            waitlistEntryId: entry._id,
            showId: show?._id,
            status: entry.status,
            show: {
                movieTitle: show?.movie?.title,
                showDateTime: show?.showDateTime,
                theater: show?.screen?.theater?.name,
            },
        };

        if (entry.status === 'waiting') {
            const position = await Waitlist.countDocuments({
                showId: entry.showId?._id || entry.showId,
                status: 'waiting',
                joinedAt: { $lte: entry.joinedAt },
            });
            return { ...base, position };
        }

        return { ...base, offeredSeat: entry.offeredSeat, offerExpiresAt: entry.offerExpiresAt };
    }));

    res.json({ success: true, waitlistEntries: results });
});


export const getWaitlistEntryStatus = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { entryId } = req.params;

    const entry = await Waitlist.findById(entryId).populate({
        path: 'showId',
        populate: [{ path: 'movie' }, SCREEN_WITH_THEATER],
    });
    if (!entry) throw new AppError('Waitlist entry not found', 404, 'WAITLIST_ENTRY_NOT_FOUND');
    if (entry.userId !== userId) throw new AppError('Not authorized to view this waitlist entry', 403, 'NOT_AUTHORIZED');

    const show = entry.showId;
    res.json({
        success: true,
        waitlistEntryId: entry._id,
        status: entry.status,
        offeredSeat: entry.offeredSeat,
        offerExpiresAt: entry.offerExpiresAt,
        show: {
            movieTitle: show?.movie?.title,
            showDateTime: show?.showDateTime,
            theater: show?.screen?.theater?.name,
        },
    });
});


export const claimWaitlistOffer = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { entryId } = req.params;
    const { origin } = req.headers;

    const entry = await Waitlist.findById(entryId);
    if (!entry) throw new AppError('Waitlist entry not found', 404, 'WAITLIST_ENTRY_NOT_FOUND');
    if (entry.userId !== userId) throw new AppError('Not authorized to claim this offer', 403, 'NOT_AUTHORIZED');
    if (entry.status !== 'offered') throw new AppError('This offer is no longer active', 409, 'OFFER_NOT_ACTIVE');
    if (Date.now() > new Date(entry.offerExpiresAt).getTime()) {
        throw new AppError('This offer has expired', 409, 'OFFER_EXPIRED');
    }

    const claimed = await Waitlist.findOneAndUpdate(
        { _id: entryId, status: 'offered', userId },
        { $set: { status: 'claimed' } },
        { new: true }
    );
    if (!claimed) {
        throw new AppError('This offer is no longer active', 409, 'OFFER_NOT_ACTIVE');
    }

    const { booking, session } = await runBookingCheckout({
        userId,
        showId: claimed.showId,
        selectedSeats: [claimed.offeredSeat],
        origin,
        skipSeatLock: true,
        extraBookingFields: { waitlistEntryId: claimed._id },
        onSeatRollback: revertWaitlistClaim(claimed),
    });

    await Waitlist.updateOne({ _id: claimed._id }, { $set: { bookingId: booking._id } });

    req.log.info({ waitlistEntryId: claimed._id.toString(), bookingId: booking._id.toString(), userId }, 'Waitlist offer claimed, checkout session started');
    res.json({ success: true, url: session.url, bookingId: booking._id });
});
