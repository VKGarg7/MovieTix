import mongoose from 'mongoose';
import OpenSlot from '../models/OpenSlot.js';
import CommunityScreeningRequest from '../models/CommunityScreeningRequest.js';
import CommunityHost from '../models/CommunityHost.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { assertScreenBelongsToTheater, loadTheaterScopedResource, resolveTheaterIdForCreate, SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { recordAudit } from '../utils/auditLog.js';

const DEFAULT_REVENUE_SPLIT_PERCENT = 70;


export const markOpenSlot = asyncHandler(async (req, res) => {
    const { screenId, proposedDateTime, basePrice, revenueSplitPercent, notes, theaterId: requestedTheaterId } = req.body;
    const { userId } = req.auth();

    if (!screenId || !proposedDateTime) {
        throw new AppError('screenId and proposedDateTime are required', 400, 'INVALID_INPUT');
    }
    if (typeof basePrice !== 'number' || !Number.isFinite(basePrice) || basePrice <= 0) {
        throw new AppError('basePrice must be a positive number', 400, 'INVALID_INPUT');
    }
    const splitPercent = revenueSplitPercent ?? DEFAULT_REVENUE_SPLIT_PERCENT;
    if (typeof splitPercent !== 'number' || splitPercent < 0 || splitPercent > 100) {
        throw new AppError('revenueSplitPercent must be between 0 and 100', 400, 'INVALID_INPUT');
    }

    const proposedDate = new Date(proposedDateTime);
    if (Number.isNaN(proposedDate.getTime())) {
        throw new AppError('proposedDateTime is invalid', 400, 'INVALID_INPUT');
    }

    const screen = await Screen.findById(screenId).populate('theater');
    if (!screen) {
        throw new AppError('Screen not found', 404, 'SCREEN_NOT_FOUND');
    }
    assertScreenBelongsToTheater(screen, req.adminContext);

    const theaterId = resolveTheaterIdForCreate(req.adminContext, requestedTheaterId);

    const slot = await OpenSlot.create({
        theaterId,
        screen: screenId,
        proposedDateTime: proposedDate,
        basePrice,
        revenueSplitPercent: splitPercent,
        notes: notes || '',
        createdBy: userId,
    });

    req.log.info({ slotId: slot._id.toString(), theaterId, screenId }, 'Open slot marked for community screening');
    res.json({ success: true, slot });
});


export const getOpenSlotsForAdmin = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = role === 'theaterAdmin' ? { theaterId } : {};
    const { page, limit, skip } = parsePagination(req.query);

    const [slots, total] = await Promise.all([
        OpenSlot.find(filter).sort({ proposedDateTime: 1 }).skip(skip).limit(limit).populate('screen'),
        OpenSlot.countDocuments(filter),
    ]);

    res.json({ success: true, slots, pageInfo: buildPageMeta(page, limit, total) });
});


export const cancelOpenSlot = asyncHandler(async (req, res) => {
    const slot = await loadTheaterScopedResource(OpenSlot, req.params.slotId, req.adminContext, 'Open slot');

    if (slot.status !== 'open') {
        throw new AppError('Only open slots can be cancelled', 400, 'SLOT_NOT_OPEN');
    }

    slot.status = 'cancelled';
    await slot.save();

    res.json({ success: true, slot });
});



export const browseOpenSlots = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { status: 'open', proposedDateTime: { $gt: new Date() } };
    if (theaterId && mongoose.Types.ObjectId.isValid(theaterId)) {
        filter.theaterId = theaterId;
    }

    const [slots, total] = await Promise.all([
        OpenSlot.find(filter)
            .sort({ proposedDateTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate('screen')
            .populate('theaterId'),
        OpenSlot.countDocuments(filter),
    ]);

    res.json({
        success: true,
        slots: slots.map(slot => ({
            slotId: slot._id,
            proposedDateTime: slot.proposedDateTime,
            basePrice: slot.basePrice,
            revenueSplitPercent: slot.revenueSplitPercent,
            notes: slot.notes,
            screen: { name: slot.screen?.name, totalCapacity: slot.screen?.totalCapacity },
            theater: { name: slot.theaterId?.name, city: slot.theaterId?.city },
        })),
        pageInfo: buildPageMeta(page, limit, total),
    });
});



export const submitScreeningRequest = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { openSlotId, filmTitle, filmDescription, filmRuntimeMinutes, expectedDraw, contactNote } = req.body;

    const host = await CommunityHost.findOne({ userId });
    if (!host || !host.verified) {
        throw new AppError('You must be a verified community host to submit a screening request', 403, 'NOT_VERIFIED');
    }
    if (!host.eligible) {
        throw new AppError('Your open-slot eligibility has been revoked. Contact support.', 403, 'NOT_ELIGIBLE');
    }

    if (!filmTitle || typeof filmTitle !== 'string') {
        throw new AppError('filmTitle is required', 400, 'INVALID_INPUT');
    }
    if (!Number.isInteger(filmRuntimeMinutes) || filmRuntimeMinutes <= 0) {
        throw new AppError('filmRuntimeMinutes must be a positive integer', 400, 'INVALID_INPUT');
    }
    if (!Number.isInteger(expectedDraw) || expectedDraw < 0) {
        throw new AppError('expectedDraw must be a non-negative integer', 400, 'INVALID_INPUT');
    }

    const slot = await OpenSlot.findById(openSlotId);
    if (!slot || slot.status !== 'open') {
        throw new AppError('This slot is no longer open for requests', 409, 'SLOT_NOT_OPEN');
    }

    let request;
    try {
        request = await CommunityScreeningRequest.create({
            theaterId: slot.theaterId,
            openSlotId: slot._id,
            requesterId: userId,
            filmTitle: filmTitle.trim(),
            filmDescription: filmDescription || '',
            filmRuntimeMinutes,
            expectedDraw,
            contactNote: contactNote || '',
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('This slot already has a pending request from another host', 409, 'SLOT_ALREADY_REQUESTED');
        }
        throw error;
    }

    req.log.info({ requestId: request._id.toString(), openSlotId, userId }, 'Community screening request submitted');
    res.json({ success: true, request });
});


export const getMyScreeningRequests = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const requests = await CommunityScreeningRequest.find({ requesterId: userId })
        .sort({ createdAt: -1 })
        .populate({ path: 'openSlotId', populate: ['screen', 'theaterId'] });

    res.json({ success: true, requests });
});


export const withdrawScreeningRequest = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { requestId } = req.params;

    const request = await CommunityScreeningRequest.findOneAndUpdate(
        { _id: requestId, requesterId: userId, status: 'pending' },
        { $set: { status: 'withdrawn' } },
        { new: true }
    );
    if (!request) {
        throw new AppError('Request not found or already resolved', 404, 'REQUEST_NOT_FOUND');
    }

    res.json({ success: true, request });
});


export const getScreeningRequestsForAdmin = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const { status } = req.query;
    const filter = role === 'theaterAdmin' ? { theaterId } : {};
    if (status) filter.status = status;

    const { page, limit, skip } = parsePagination(req.query);

    const [requests, total] = await Promise.all([
        CommunityScreeningRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'openSlotId', populate: 'screen' }),
        CommunityScreeningRequest.countDocuments(filter),
    ]);

    res.json({ success: true, requests, pageInfo: buildPageMeta(page, limit, total) });
});


export const approveScreeningRequest = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { requestId } = req.params;

    const request = await CommunityScreeningRequest.findById(requestId).populate('openSlotId');
    if (!request) {
        throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }
    if (req.adminContext.role === 'theaterAdmin' && request.theaterId.toString() !== req.adminContext.theaterId) {
        throw new AppError('This request does not belong to your theater', 403, 'NOT_AUTHORIZED');
    }
    if (request.status !== 'pending') {
        throw new AppError('Only pending requests can be approved', 400, 'REQUEST_NOT_PENDING');
    }

    const slot = request.openSlotId;
    if (!slot || slot.status !== 'open') {
        throw new AppError('The underlying slot is no longer open', 409, 'SLOT_NOT_OPEN');
    }

    const host = await CommunityHost.findOne({ userId: request.requesterId });
    if (!host || !host.verified || !host.eligible) {
        throw new AppError('The requesting host is no longer verified/eligible', 409, 'HOST_NOT_ELIGIBLE');
    }

    const PLACEHOLDER_POSTER_PATH = '/community-screening-placeholder.png';
    const movie = await mongoose.model('Movie').create({
        _id: new mongoose.Types.ObjectId().toString(),
        title: request.filmTitle,
        overview: request.filmDescription || `An independent/community screening: ${request.filmTitle}.`,
        poster_path: PLACEHOLDER_POSTER_PATH,
        backdrop_path: PLACEHOLDER_POSTER_PATH,
        genres: [],
        casts: [],
        release_date: new Date().toISOString().slice(0, 10),
        original_language: 'en',
        tagline: '',
        vote_average: 0,
        runtime: request.filmRuntimeMinutes,
    });

    const show = await Show.create({
        movie: movie._id,
        screen: slot.screen,
        showDateTime: slot.proposedDateTime,
        showPrice: slot.basePrice,
        occupiedSeats: {},
        isMysteryMovie: false,
        mysteryRevealAt: 'onBooking',
        communityHostId: host._id,
        revenueSplitPercent: slot.revenueSplitPercent,
    });

    request.status = 'approved';
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    request.showId = show._id;
    await request.save();

    slot.status = 'filled';
    slot.filledByRequestId = request._id;
    await slot.save();

    await recordAudit({
        req,
        action: 'create',
        entityType: 'Show',
        entityId: show._id,
        diff: { after: { source: 'community', requestId: request._id.toString(), hostId: host._id.toString(), showId: show._id.toString() } },
    });

    await inngest.send({
        name: 'app/community-screening.approved',
        data: { requestId: request._id.toString(), showId: show._id.toString() },
    });

    req.log.info({ requestId, showId: show._id.toString(), hostId: host._id.toString() }, 'Community screening request approved, Show created');
    res.json({ success: true, request, showId: show._id });
});


export const rejectScreeningRequest = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await CommunityScreeningRequest.findById(requestId);
    if (!request) {
        throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }
    if (req.adminContext.role === 'theaterAdmin' && request.theaterId.toString() !== req.adminContext.theaterId) {
        throw new AppError('This request does not belong to your theater', 403, 'NOT_AUTHORIZED');
    }
    if (request.status !== 'pending') {
        throw new AppError('Only pending requests can be rejected', 400, 'REQUEST_NOT_PENDING');
    }

    request.status = 'rejected';
    request.rejectionReason = reason || null;
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    await request.save();

    await inngest.send({
        name: 'app/community-screening.rejected',
        data: { requestId: request._id.toString() },
    });

    req.log.info({ requestId, userId }, 'Community screening request rejected');
    res.json({ success: true, request });
});
