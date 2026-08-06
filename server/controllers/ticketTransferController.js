import stripe from 'stripe';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import TicketTransfer from '../models/TicketTransfer.js';
import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { loadOwnedBooking } from '../utils/bookingOwnership.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';

export const TRANSFER_CUTOFF_MINUTES = 30;

const assertTransferable = (booking, show) => {
    if (!booking.isPaid || booking.status !== 'confirmed') {
        throw new AppError('Only confirmed, paid bookings can be transferred', 400, 'BOOKING_NOT_TRANSFERABLE');
    }
    const cutoffMs = TRANSFER_CUTOFF_MINUTES * 60 * 1000;
    if (show.showDateTime.getTime() - Date.now() < cutoffMs) {
        throw new AppError(`Tickets can't be transferred within ${TRANSFER_CUTOFF_MINUTES} minutes of showtime`, 400, 'TRANSFER_WINDOW_PASSED');
    }
};

const loadShowForBooking = async (booking) => {
    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER).populate('movie');
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }
    return show;
};

const invalidateTicket = (booking) => {
    booking.ticketNonce = crypto.randomBytes(9).toString('base64url');
};


export const initiateDirectTransfer = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { bookingId } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
        throw new AppError('recipientEmail is required', 400, 'INVALID_INPUT');
    }

    const booking = await loadOwnedBooking(bookingId, userId);
    const show = await loadShowForBooking(booking);
    assertTransferable(booking, show);

    const transfer = await TicketTransfer.create({
        booking: booking._id,
        show: booking.show,
        sellerId: userId,
        mode: 'direct',
        recipientEmail: recipientEmail.trim().toLowerCase(),
        originalPrice: booking.amount,
    });

    await inngest.send({
        name: 'app/ticket-transfer.direct-sent',
        data: { transferId: transfer._id.toString() },
    });

    req.log.info({ transferId: transfer._id.toString(), bookingId, userId }, 'Direct ticket transfer initiated');
    res.json({ success: true, transferId: transfer._id });
});


export const listTicketForResale = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { bookingId } = req.params;
    const { resalePrice } = req.body;

    const booking = await loadOwnedBooking(bookingId, userId);
    const show = await loadShowForBooking(booking);
    assertTransferable(booking, show);

    if (!Number.isFinite(resalePrice) || resalePrice <= 0) {
        throw new AppError('resalePrice must be a positive number', 400, 'INVALID_INPUT');
    }
    if (resalePrice > booking.amount) {
        throw new AppError('Resale price cannot exceed the original amount paid', 400, 'RESALE_PRICE_TOO_HIGH');
    }

    const transfer = await TicketTransfer.create({
        booking: booking._id,
        show: booking.show,
        sellerId: userId,
        mode: 'resale',
        originalPrice: booking.amount,
        resalePrice,
    });

    req.log.info({ transferId: transfer._id.toString(), bookingId, userId, resalePrice }, 'Ticket listed for resale');
    res.json({ success: true, transferId: transfer._id });
});


export const cancelTicketTransfer = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { transferId } = req.params;

    const transfer = await TicketTransfer.findOneAndUpdate(
        { _id: transferId, sellerId: userId, status: 'pending' },
        { $set: { status: 'cancelled' } },
        { new: true }
    );
    if (!transfer) {
        throw new AppError('Transfer or listing not found, or already resolved', 404, 'TRANSFER_NOT_FOUND');
    }

    req.log.info({ transferId, userId }, 'Ticket transfer/listing cancelled');
    res.json({ success: true });
});


export const getTicketTransferStatus = asyncHandler(async (req, res) => {
    const { transferId } = req.params;

    const transfer = await TicketTransfer.findById(transferId).populate({
        path: 'show',
        populate: [{ path: 'movie' }, SCREEN_WITH_THEATER],
    });
    if (!transfer) {
        throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }

    res.json({
        success: true,
        transferId: transfer._id,
        mode: transfer.mode,
        status: transfer.status,
        resalePrice: transfer.resalePrice,
        show: {
            movieTitle: transfer.show?.movie?.title,
            showDateTime: transfer.show?.showDateTime,
            theater: transfer.show?.screen?.theater?.name,
        },
    });
});


export const browseResaleListings = asyncHandler(async (req, res) => {
    const { showId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { mode: 'resale', status: 'pending' };
    if (showId) filter.show = showId;

    const [listings, total] = await Promise.all([
        TicketTransfer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'show', populate: [{ path: 'movie' }, SCREEN_WITH_THEATER] })
            .populate({ path: 'booking', select: 'bookedSeats' }),
        TicketTransfer.countDocuments(filter),
    ]);

    res.json({
        success: true,
        listings: listings
            .filter(listing => listing.show && !listing.show.isCancelled && listing.show.showDateTime.getTime() > Date.now())
            .map(listing => ({
                transferId: listing._id,
                resalePrice: listing.resalePrice,
                originalPrice: listing.originalPrice,
                seats: listing.booking?.bookedSeats || [],
                show: {
                    movieTitle: listing.show.movie?.title,
                    poster_path: listing.show.movie?.poster_path,
                    showDateTime: listing.show.showDateTime,
                    theater: listing.show.screen?.theater?.name,
                },
            })),
        pageInfo: buildPageMeta(page, limit, total),
    });
});


export const getMyTicketTransfers = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const transfers = await TicketTransfer.find({ sellerId: userId })
        .sort({ createdAt: -1 })
        .populate({ path: 'show', populate: [{ path: 'movie' }, SCREEN_WITH_THEATER] });

    res.json({
        success: true,
        transfers: transfers.map(t => ({
            transferId: t._id,
            mode: t.mode,
            status: t.status,
            recipientEmail: t.recipientEmail,
            resalePrice: t.resalePrice,
            originalPrice: t.originalPrice,
            claimedAt: t.claimedAt,
            show: {
                movieTitle: t.show?.movie?.title,
                showDateTime: t.show?.showDateTime,
                theater: t.show?.screen?.theater?.name,
            },
        })),
    });
});

export const claimDirectTransfer = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { transferId } = req.params;

    const transfer = await TicketTransfer.findById(transferId);
    if (!transfer) throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    if (transfer.mode !== 'direct') throw new AppError('This is not a direct transfer', 400, 'INVALID_TRANSFER_MODE');
    if (transfer.status !== 'pending') throw new AppError('This transfer is no longer available', 409, 'TRANSFER_INACTIVE');

    const booking = await Booking.findById(transfer.booking);
    if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');

    const show = await loadShowForBooking(booking);
    assertTransferable(booking, show);

    const updatedTransfer = await TicketTransfer.findOneAndUpdate(
        { _id: transferId, status: 'pending' },
        { $set: { status: 'claimed', claimedBy: userId, claimedAt: new Date() } },
        { new: true }
    );
    if (!updatedTransfer) {
        throw new AppError('This transfer was already claimed', 409, 'TRANSFER_INACTIVE');
    }

    booking.user = userId;
    invalidateTicket(booking);
    await booking.save();

    req.log.info({ transferId, bookingId: booking._id.toString(), fromUser: transfer.sellerId, toUser: userId }, 'Direct ticket transfer claimed');
    res.json({ success: true, bookingId: booking._id });
});

export const claimResaleListing = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { transferId } = req.params;
    const { origin } = req.headers;

    const transfer = await TicketTransfer.findById(transferId);
    if (!transfer) throw new AppError('Listing not found', 404, 'TRANSFER_NOT_FOUND');
    if (transfer.mode !== 'resale') throw new AppError('This is not a resale listing', 400, 'INVALID_TRANSFER_MODE');
    if (transfer.status !== 'pending') throw new AppError('This listing is no longer available', 409, 'TRANSFER_INACTIVE');
    if (transfer.sellerId === userId) throw new AppError("You can't buy your own listing", 400, 'INVALID_INPUT');

    const booking = await Booking.findById(transfer.booking);
    if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');

    const show = await loadShowForBooking(booking);
    assertTransferable(booking, show);

    const lockedTransfer = await TicketTransfer.findOneAndUpdate(
        { _id: transferId, status: 'pending' },
        { $set: { status: 'claimed', claimedBy: userId, claimedAt: new Date() } },
        { new: true }
    );
    if (!lockedTransfer) {
        throw new AppError('This listing was already claimed', 409, 'TRANSFER_INACTIVE');
    }

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings?booking=${booking._id}`,
            cancel_url: `${origin}/resale`,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: show.isMysteryMovie ? 'Mystery Movie Ticket (resale)' : `${show.movie.title} (resale)` },
                    unit_amount: Math.round(transfer.resalePrice * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { mode: 'ticket_resale', transferId: transfer._id.toString() },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        req.log.info({ transferId, bookingId: booking._id.toString(), buyerId: userId }, 'Resale checkout started');
        res.json({ success: true, url: session.url });
    } catch (error) {
        await TicketTransfer.updateOne(
            { _id: transferId },
            { $set: { status: 'pending', claimedBy: null, claimedAt: null } }
        );
        throw error;
    }
});
