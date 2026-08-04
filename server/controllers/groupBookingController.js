import stripe from 'stripe';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import GroupBooking from '../models/GroupBooking.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { buildSeatCapacityByRow, isSeatValidForScreen } from '../utils/seatId.js';
import { releaseSeatsAndNotifyWaitlist, occupySeatsIfFree } from '../utils/seatOperations.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { releaseCouponAtomic } from './couponController.js';
import { reverseEarnedPoints, refundRedeemedPoints } from '../utils/loyaltyPoints.js';
import { runBookingCheckout, MAX_SEATS_PER_BOOKING } from './bookingController.js';
import { updateClaimsForSeats, revertClaimsToUnclaimed } from '../utils/groupBookingClaims.js';

const MAX_GROUP_BLOCK_SIZE = parseInt(process.env.GROUP_BOOKING_MAX_BLOCK_SIZE, 10) || 30;
const DEFAULT_GROUP_EXPIRY_HOURS = parseInt(process.env.GROUP_BOOKING_DEFAULT_EXPIRY_HOURS, 10) || 24;
const MAX_GROUP_EXPIRY_HOURS = parseInt(process.env.GROUP_BOOKING_MAX_EXPIRY_HOURS, 10) || 72;


export const createGroupBookingForShow = async ({ organizerId, showId, seatBlock, expiresInHours, organizerNote, origin }) => {
    if (!showId || !Array.isArray(seatBlock) || seatBlock.length === 0) {
        throw new AppError('showId and seatBlock are required', 400, 'INVALID_INPUT');
    }
    if (new Set(seatBlock).size !== seatBlock.length) {
        throw new AppError('Duplicate seats in seatBlock', 400, 'INVALID_INPUT');
    }
    if (seatBlock.length > MAX_GROUP_BLOCK_SIZE) {
        throw new AppError(`Group blocks are limited to ${MAX_GROUP_BLOCK_SIZE} seats`, 400, 'BLOCK_TOO_LARGE');
    }

    const hours = expiresInHours
        ? Math.min(Math.max(1, expiresInHours), MAX_GROUP_EXPIRY_HOURS)
        : DEFAULT_GROUP_EXPIRY_HOURS;

    const showForSeatCheck = await Show.findById(showId).populate(SCREEN_WITH_THEATER);
    if (!showForSeatCheck || showForSeatCheck.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const seatCapacityByRow = buildSeatCapacityByRow(showForSeatCheck.screen);
    if (!seatBlock.every(seat => isSeatValidForScreen(seat, seatCapacityByRow))) {
        throw new AppError('Invalid seat selection', 400, 'INVALID_SEATS');
    }

    const showData = await occupySeatsIfFree(showId, seatBlock, organizerId);

    if (!showData) {
        const showExists = await Show.exists({ _id: showId });
        throw new AppError(
            showExists ? "Selected seats are not available" : "Show not found",
            showExists ? 409 : 404,
            showExists ? 'SEATS_UNAVAILABLE' : 'SHOW_NOT_FOUND'
        );
    }

    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    let groupBooking;
    try {
        groupBooking = await GroupBooking.create({
            organizerId,
            show: showId,
            seatBlock,
            expiresAt,
            claims: seatBlock.map(seat => ({ seat })),
            organizerNote: organizerNote || '',
        });

        await inngest.send({
            name: 'app/group-booking.expire',
            data: { groupBookingId: groupBooking._id.toString(), expiresAt: expiresAt.toISOString() },
        });
    } catch (error) {
        await releaseSeatsAndNotifyWaitlist(showId, seatBlock);
        throw error;
    }

    return {
        groupBooking,
        shareUrl: `${origin}/group-booking/${groupBooking._id}`,
        expiresAt,
    };
};

export const createGroupBooking = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { showId, seatBlock, expiresInHours, organizerNote } = req.body;
    const { origin } = req.headers;

    const { groupBooking, shareUrl, expiresAt } = await createGroupBookingForShow({
        organizerId: userId, showId, seatBlock, expiresInHours, organizerNote, origin,
    });

    req.log.info({ groupBookingId: groupBooking._id.toString(), showId, userId, seatCount: seatBlock.length }, 'Group booking created');
    res.json({
        success: true,
        groupId: groupBooking._id,
        shareUrl,
        expiresAt,
    });
});


export const claimGroupSeats = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { groupId } = req.params;
    const { selectedSeats, snacks: requestedSnacks, redeemPoints, couponCode } = req.body;
    const { origin } = req.headers;

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        throw new AppError('selectedSeats is required', 400, 'INVALID_INPUT');
    }
    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
        throw new AppError(`You can claim at most ${MAX_SEATS_PER_BOOKING} seats`, 400, 'TOO_MANY_SEATS');
    }
    if (new Set(selectedSeats).size !== selectedSeats.length) {
        throw new AppError('Duplicate seats in selectedSeats', 400, 'INVALID_INPUT');
    }

    const group = await GroupBooking.findById(groupId);
    if (!group) throw new AppError('Group booking not found', 404, 'GROUP_NOT_FOUND');
    if (group.status !== 'active') throw new AppError('This group booking is no longer active', 409, 'GROUP_INACTIVE');
    if (group.expiresAt.getTime() < Date.now()) throw new AppError('This group booking has expired', 409, 'GROUP_EXPIRED');
    if (!selectedSeats.every(seat => group.seatBlock.includes(seat))) {
        throw new AppError('Selected seat is not part of this group booking', 400, 'SEAT_NOT_IN_BLOCK');
    }

    const updatedGroup = await updateClaimsForSeats(
        groupId,
        selectedSeats,
        { userId, claimedAt: new Date() },
        {
            extraArrayFilterFields: { userId: null }, // race guard: only claim seats still unclaimed
            filter: {
                status: 'active',
                $and: selectedSeats.map(seat => ({ claims: { $elemMatch: { seat, userId: null } } })),
            },
        }
    );

    if (!updatedGroup) {
        throw new AppError('One or more selected seats have already been claimed', 409, 'SEATS_ALREADY_CLAIMED');
    }

    const { booking, session } = await runBookingCheckout({
        userId,
        showId: group.show,
        selectedSeats,
        couponCode,
        requestedSnacks,
        redeemPoints,
        origin,
        skipSeatLock: true,
        extraBookingFields: { groupBookingId: group._id, groupBookingSeats: selectedSeats },
        onSeatRollback: seats => revertClaimsToUnclaimed(group._id, seats),
    });

    await updateClaimsForSeats(group._id, selectedSeats, { bookingId: booking._id });

    req.log.info({ groupId, bookingId: booking._id.toString(), userId, seats: selectedSeats }, 'Group seats claimed, checkout session started');
    res.json({ success: true, url: session.url, bookingId: booking._id });
});


export const getGroupBookingStatus = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const group = await GroupBooking.findById(groupId).populate({
        path: 'show',
        populate: [{ path: 'movie' }, SCREEN_WITH_THEATER],
    });
    if (!group) throw new AppError('Group booking not found', 404, 'GROUP_NOT_FOUND');

    const seats = group.claims.map(c => ({ seat: c.seat, claimed: !!c.userId, isPaid: c.isPaid }));

    res.json({
        success: true,
        groupId: group._id,
        status: group.status,
        expiresAt: group.expiresAt,
        show: {
            movieTitle: group.show?.movie?.title,
            showDateTime: group.show?.showDateTime,
            theater: group.show?.screen?.theater?.name,
            rows: group.show?.screen?.rows,
        },
        seats,
        claimedCount: seats.filter(s => s.claimed).length,
        paidCount: seats.filter(s => s.isPaid).length,
        totalSeats: group.seatBlock.length,
    });
});


export const getMyGroupBookings = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const groups = await GroupBooking.find({ organizerId: userId })
        .sort({ createdAt: -1 })
        .populate({ path: 'show', populate: [{ path: 'movie' }, SCREEN_WITH_THEATER] });

    res.json({
        success: true,
        groupBookings: groups.map(group => ({
            groupId: group._id,
            status: group.status,
            expiresAt: group.expiresAt,
            createdAt: group.createdAt,
            show: {
                movieTitle: group.show?.movie?.title,
                showDateTime: group.show?.showDateTime,
                theater: group.show?.screen?.theater?.name,
            },
            claimedCount: group.claims.filter(c => c.userId).length,
            paidCount: group.claims.filter(c => c.isPaid).length,
            totalSeats: group.seatBlock.length,
        })),
    });
});


export const getGroupBookingManageStatus = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { groupId } = req.params;
    const group = await GroupBooking.findById(groupId).populate({
        path: 'show',
        populate: [{ path: 'movie' }, SCREEN_WITH_THEATER],
    });
    if (!group) throw new AppError('Group booking not found', 404, 'GROUP_NOT_FOUND');
    if (group.organizerId !== userId) throw new AppError('Not authorized to manage this group booking', 403, 'NOT_AUTHORIZED');

    res.json({
        success: true,
        groupId: group._id,
        status: group.status,
        expiresAt: group.expiresAt,
        show: {
            movieTitle: group.show?.movie?.title,
            showDateTime: group.show?.showDateTime,
            theater: group.show?.screen?.theater?.name,
            rows: group.show?.screen?.rows,
        },
        seats: group.claims.map(c => ({
            seat: c.seat, userId: c.userId, bookingId: c.bookingId, isPaid: c.isPaid, claimedAt: c.claimedAt,
        })),
        claimedCount: group.claims.filter(c => c.userId).length,
        paidCount: group.claims.filter(c => c.isPaid).length,
        totalSeats: group.seatBlock.length,
    });
});


export const cancelGroupBooking = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { groupId } = req.params;

    const group = await GroupBooking.findById(groupId);
    if (!group) throw new AppError('Group booking not found', 404, 'GROUP_NOT_FOUND');
    if (group.organizerId !== userId) throw new AppError('Not authorized to cancel this group booking', 403, 'NOT_AUTHORIZED');
    if (group.status === 'cancelled') throw new AppError('Group booking is already cancelled', 409, 'ALREADY_CANCELLED');

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const failedRefundBookingIds = [];

    const paidClaims = group.claims.filter(c => c.isPaid && c.bookingId);
    for (const claim of paidClaims) {
        const claimBooking = await Booking.findById(claim.bookingId);
        if (!claimBooking || claimBooking.status === 'cancelled') continue;

        try {
            await stripeInstance.refunds.create({ payment_intent: claimBooking.paymentIntentId });
            claimBooking.status = 'cancelled';
            claimBooking.isPaid = false;
            await claimBooking.save();

            if (claimBooking.couponCode) {
                await releaseCouponAtomic(claimBooking.couponCode);
            }
            await reverseEarnedPoints(claim.userId, claim.bookingId.toString());
            if (claimBooking.pointsRedeemed > 0) {
                await refundRedeemedPoints(claim.userId, claim.bookingId.toString());
            }
        } catch (error) {
            // Deliberate divergence from single-booking cancelBooking: we do NOT
            // re-occupy this seat on refund failure. cancelBooking re-occupies to
            // protect a single self-service user from losing seat + money at once.
            // Here the ORGANIZER is authoritatively tearing down the whole event,
            // so leaving the seat locked pending a Stripe retry would contradict
            // that intent — flag for manual/finance reconciliation instead.
            req.log.error({ err: error, bookingId: claim.bookingId }, 'Refund failed for group claim, marking pending-cancellation');
            claimBooking.status = 'pending-cancellation';
            await claimBooking.save();
            failedRefundBookingIds.push(claim.bookingId.toString());
        }
    }

    const pendingClaimBookingIds = group.claims
        .filter(c => c.bookingId && !c.isPaid)
        .map(c => c.bookingId);
    if (pendingClaimBookingIds.length) {
        await Booking.updateMany({ _id: { $in: pendingClaimBookingIds } }, { $set: { status: 'cancelled' } });
    }

    await releaseSeatsAndNotifyWaitlist(group.show, group.seatBlock);

    group.status = 'cancelled';
    await group.save();

    req.log.info({ groupId, failedRefundCount: failedRefundBookingIds.length }, 'Group booking cancelled');
    res.json({
        success: true,
        message: failedRefundBookingIds.length
            ? 'Group booking cancelled. Some refunds require manual review.'
            : 'Group booking cancelled and refunds initiated for all paid claims.',
        failedRefundBookingIds,
    });
});
