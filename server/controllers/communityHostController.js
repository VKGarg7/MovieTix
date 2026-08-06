import CommunityHost from '../models/CommunityHost.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';

export const applyAsCommunityHost = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { organizationName, description } = req.body;

    if (!organizationName || typeof organizationName !== 'string') {
        throw new AppError('organizationName is required', 400, 'INVALID_INPUT');
    }

    const existing = await CommunityHost.findOne({ userId });
    if (existing) {
        throw new AppError('You have already applied as a community host', 409, 'ALREADY_APPLIED');
    }

    const host = await CommunityHost.create({
        userId,
        organizationName: organizationName.trim(),
        description: description || '',
    });

    res.json({ success: true, host });
});


export const getMyCommunityHostProfile = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const host = await CommunityHost.findOne({ userId });
    res.json({ success: true, host });
});


export const getAllCommunityHosts = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    const [hosts, total] = await Promise.all([
        CommunityHost.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        CommunityHost.countDocuments(),
    ]);

    res.json({ success: true, hosts, pageInfo: buildPageMeta(page, limit, total) });
});


export const verifyCommunityHost = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { hostId } = req.params;

    const host = await CommunityHost.findById(hostId);
    if (!host) {
        throw new AppError('Community host not found', 404, 'HOST_NOT_FOUND');
    }

    host.verified = true;
    host.eligible = true;
    host.verifiedBy = userId;
    host.verifiedAt = new Date();
    host.revokedBy = null;
    host.revokedAt = null;
    host.revokedReason = null;
    await host.save();

    req.log.info({ hostId, userId }, 'Community host verified');
    res.json({ success: true, host });
});


export const revokeCommunityHostEligibility = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { hostId } = req.params;
    const { reason } = req.body;

    const host = await CommunityHost.findById(hostId);
    if (!host) {
        throw new AppError('Community host not found', 404, 'HOST_NOT_FOUND');
    }

    host.eligible = false;
    host.revokedBy = userId;
    host.revokedAt = new Date();
    host.revokedReason = reason || null;
    await host.save();

    req.log.info({ hostId, userId, reason }, 'Community host eligibility revoked');
    res.json({ success: true, host });
});


export const reinstateCommunityHostEligibility = asyncHandler(async (req, res) => {
    const { hostId } = req.params;

    const host = await CommunityHost.findById(hostId);
    if (!host) {
        throw new AppError('Community host not found', 404, 'HOST_NOT_FOUND');
    }

    host.eligible = true;
    host.revokedBy = null;
    host.revokedAt = null;
    host.revokedReason = null;
    await host.save();

    req.log.info({ hostId }, 'Community host eligibility reinstated');
    res.json({ success: true, host });
});
