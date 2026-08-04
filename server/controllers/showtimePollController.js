import Show from '../models/Show.js';
import ShowtimePoll from '../models/ShowtimePoll.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { getSeatCapacityInfo } from '../utils/seatOperations.js';
import { SCREEN_WITH_THEATER } from '../utils/theaterScope.js';
import { createGroupBookingForShow } from './groupBookingController.js';

const MIN_CANDIDATES = 2;
const MAX_CANDIDATES = 4;
const DEFAULT_POLL_EXPIRY_HOURS = parseInt(process.env.SHOWTIME_POLL_DEFAULT_EXPIRY_HOURS, 10) || 48;
const MAX_POLL_EXPIRY_HOURS = parseInt(process.env.SHOWTIME_POLL_MAX_EXPIRY_HOURS, 10) || 168;

const withShowDetails = query => query.populate({
    path: 'candidateShows.show',
    populate: [{ path: 'movie' }, SCREEN_WITH_THEATER],
});

const summarizeCandidate = (candidate, voteCounts) => ({
    showId: candidate.show._id,
    removed: candidate.removed,
    movieTitle: candidate.show.movie?.title,
    showDateTime: candidate.show.showDateTime,
    theater: candidate.show.screen?.theater?.name,
    votes: voteCounts[candidate.show._id.toString()] || 0,
});

const countVotes = invitees => invitees.reduce((counts, invitee) => {
    if (invitee.votedFor) counts[invitee.votedFor] = (counts[invitee.votedFor] || 0) + 1;
    return counts;
}, {});

const isCandidateStillAvailable = async (showId) => {
    const show = await Show.findById(showId).populate(SCREEN_WITH_THEATER);
    if (!show || show.isCancelled) return false;
    return !getSeatCapacityInfo(show).isSoldOut;
};

export const createShowtimePoll = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { showIds, inviteeNames, expiresInHours, organizerNote } = req.body;
    const { origin } = req.headers;

    if (!Array.isArray(showIds) || showIds.length < MIN_CANDIDATES || showIds.length > MAX_CANDIDATES) {
        throw new AppError(`Select between ${MIN_CANDIDATES} and ${MAX_CANDIDATES} candidate shows`, 400, 'INVALID_INPUT');
    }
    if (new Set(showIds).size !== showIds.length) {
        throw new AppError('Duplicate candidate shows', 400, 'INVALID_INPUT');
    }
    if (!Array.isArray(inviteeNames) || inviteeNames.length === 0) {
        throw new AppError('At least one invitee name is required', 400, 'INVALID_INPUT');
    }

    const shows = await Show.find({ _id: { $in: showIds } });
    if (shows.length !== showIds.length || shows.some(s => s.isCancelled)) {
        throw new AppError('One or more candidate shows not found', 404, 'SHOW_NOT_FOUND');
    }

    const hours = expiresInHours
        ? Math.min(Math.max(1, expiresInHours), MAX_POLL_EXPIRY_HOURS)
        : DEFAULT_POLL_EXPIRY_HOURS;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const poll = await ShowtimePoll.create({
        organizerId: userId,
        candidateShows: showIds.map(show => ({ show })),
        invitees: inviteeNames.map(name => ({ name })),
        invitedCount: inviteeNames.length,
        quorumCount: Math.floor(inviteeNames.length / 2) + 1,
        expiresAt,
        organizerNote: organizerNote || '',
    });

    await inngest.send({
        name: 'app/showtime-poll.expire',
        data: { pollId: poll._id.toString(), expiresAt: expiresAt.toISOString() },
    });

    req.log.info({ pollId: poll._id.toString(), userId, candidateCount: showIds.length }, 'Showtime poll created');
    res.json({
        success: true,
        pollId: poll._id,
        shareUrl: `${origin}/showtime-poll/${poll._id}`,
        expiresAt,
    });
});

export const getShowtimePollStatus = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const poll = await withShowDetails(ShowtimePoll.findById(pollId));
    if (!poll) throw new AppError('Showtime poll not found', 404, 'POLL_NOT_FOUND');

    const voteCounts = countVotes(poll.invitees);

    res.json({
        success: true,
        pollId: poll._id,
        status: poll.status,
        expiresAt: poll.expiresAt,
        organizerNote: poll.organizerNote,
        invitedCount: poll.invitedCount,
        quorumCount: poll.quorumCount,
        votedCount: poll.invitees.filter(i => i.votedFor).length,
        candidates: poll.candidateShows.map(c => summarizeCandidate(c, voteCounts)),
        winningShow: poll.winningShow,
        resultingGroupBookingId: poll.resultingGroupBookingId,
    });
});

export const voteOnShowtimePoll = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const { name, showId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new AppError('name is required', 400, 'INVALID_INPUT');
    }
    if (!showId) throw new AppError('showId is required', 400, 'INVALID_INPUT');

    const poll = await ShowtimePoll.findById(pollId);
    if (!poll) throw new AppError('Showtime poll not found', 404, 'POLL_NOT_FOUND');
    if (poll.status !== 'active') throw new AppError('This poll is no longer accepting votes', 409, 'POLL_INACTIVE');
    if (poll.expiresAt.getTime() < Date.now()) throw new AppError('This poll has expired', 409, 'POLL_EXPIRED');

    const candidate = poll.candidateShows.find(c => c.show.toString() === showId);
    if (!candidate) throw new AppError('That show is not a candidate in this poll', 400, 'INVALID_CANDIDATE');
    if (candidate.removed) throw new AppError('That option was removed because it sold out — please vote again', 409, 'CANDIDATE_REMOVED');

    if (!(await isCandidateStillAvailable(showId))) {
        candidate.removed = true;
        poll.invitees.forEach(invitee => {
            if (invitee.votedFor === showId) invitee.votedFor = null;
        });
        await poll.save();
        throw new AppError('That option just sold out and was removed — please vote again', 409, 'CANDIDATE_REMOVED');
    }

    const trimmedName = name.trim();
    let invitee = poll.invitees.find(i => i.name.toLowerCase() === trimmedName.toLowerCase());
    if (invitee) {
        invitee.votedFor = showId;
    } else {
        poll.invitees.push({ name: trimmedName, votedFor: showId });
        poll.invitedCount = Math.max(poll.invitedCount, poll.invitees.length);
        poll.quorumCount = Math.floor(poll.invitedCount / 2) + 1;
    }

    const votedCount = poll.invitees.filter(i => i.votedFor).length;
    const reachedQuorum = votedCount >= poll.quorumCount;

    await poll.save();

    req.log.info({ pollId, name: trimmedName, showId, votedCount }, 'Vote recorded on showtime poll');

    if (reachedQuorum) {
        await tryAutoClose(poll._id, req.headers.origin, req.log);
    }

    res.json({ success: true });
});

const tryAutoClose = async (pollId, origin, log) => {
    const poll = await withShowDetails(ShowtimePoll.findById(pollId));
    if (!poll || poll.status !== 'active') return;

    const voteCounts = countVotes(poll.invitees);
    const activeCandidates = poll.candidateShows.filter(c => !c.removed);
    const ranked = activeCandidates
        .map(c => ({ showId: c.show._id.toString(), votes: voteCounts[c.show._id.toString()] || 0 }))
        .sort((a, b) => b.votes - a.votes);

    if (ranked.length === 0) return;
    const isTie = ranked.length > 1 && ranked[0].votes === ranked[1].votes;
    if (isTie) return;

    await closePollWithWinner(poll, ranked[0].showId, origin, log);
};

const closePollWithWinner = async (poll, winningShowId, origin, log) => {
    const winningShow = await Show.findById(winningShowId).populate(SCREEN_WITH_THEATER);
    const availableSeats = winningShow.screen.rows
        .flatMap(row => Array.from({ length: row.seatCount }, (_, i) => `${row.label}${i + 1}`))
        .filter(seat => !winningShow.occupiedSeats[seat]);

    const votedCount = poll.invitees.filter(i => i.votedFor === winningShowId).length || poll.invitees.length;
    const blockSize = Math.max(1, Math.min(votedCount, availableSeats.length));
    const seatBlock = availableSeats.slice(0, blockSize);

    if (seatBlock.length === 0) {
        throw new AppError('The winning show has no available seats', 409, 'SEATS_UNAVAILABLE');
    }

    const { groupBooking } = await createGroupBookingForShow({
        organizerId: poll.organizerId,
        showId: winningShowId,
        seatBlock,
        organizerNote: poll.organizerNote,
        origin,
    });

    poll.status = 'closed';
    poll.winningShow = winningShowId;
    poll.resultingGroupBookingId = groupBooking._id;
    await poll.save();

    await inngest.send({
        name: 'app/showtime-poll.closed',
        data: { pollId: poll._id.toString(), groupBookingId: groupBooking._id.toString() },
    });

    log?.info({ pollId: poll._id.toString(), winningShowId, groupBookingId: groupBooking._id.toString() }, 'Showtime poll closed, group booking created');

    return groupBooking;
};

export const closeShowtimePoll = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { pollId } = req.params;
    const { winningShowId } = req.body;
    const { origin } = req.headers;

    const poll = await withShowDetails(ShowtimePoll.findById(pollId));
    if (!poll) throw new AppError('Showtime poll not found', 404, 'POLL_NOT_FOUND');
    if (poll.organizerId !== userId) throw new AppError('Not authorized to close this poll', 403, 'NOT_AUTHORIZED');
    if (poll.status !== 'active') throw new AppError('This poll is already closed', 409, 'POLL_INACTIVE');

    const activeCandidates = poll.candidateShows.filter(c => !c.removed);
    if (activeCandidates.length === 0) {
        throw new AppError('All candidate shows have sold out', 409, 'NO_CANDIDATES_LEFT');
    }

    let chosenShowId = winningShowId;
    if (!chosenShowId) {
        const voteCounts = countVotes(poll.invitees);
        const ranked = activeCandidates
            .map(c => ({ showId: c.show._id.toString(), votes: voteCounts[c.show._id.toString()] || 0 }))
            .sort((a, b) => b.votes - a.votes);
        const isTie = ranked.length > 1 && ranked[0].votes === ranked[1].votes;
        if (isTie) {
            throw new AppError('Votes are tied — pass winningShowId to break the tie manually', 409, 'TIE_UNBROKEN');
        }
        chosenShowId = ranked[0].showId;
    }
    if (!activeCandidates.some(c => c.show._id.toString() === chosenShowId)) {
        throw new AppError('winningShowId is not an active candidate', 400, 'INVALID_CANDIDATE');
    }

    const groupBooking = await closePollWithWinner(poll, chosenShowId, origin, req.log);

    res.json({
        success: true,
        winningShowId: chosenShowId,
        groupId: groupBooking._id,
        shareUrl: `${origin}/group-booking/${groupBooking._id}`,
    });
});

export const getMyShowtimePolls = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const polls = await withShowDetails(
        ShowtimePoll.find({ organizerId: userId }).sort({ createdAt: -1 })
    );

    res.json({
        success: true,
        polls: polls.map(poll => {
            const voteCounts = countVotes(poll.invitees);
            return {
                pollId: poll._id,
                status: poll.status,
                expiresAt: poll.expiresAt,
                createdAt: poll.createdAt,
                candidates: poll.candidateShows.map(c => summarizeCandidate(c, voteCounts)),
                votedCount: poll.invitees.filter(i => i.votedFor).length,
                invitedCount: poll.invitedCount,
                winningShow: poll.winningShow,
                resultingGroupBookingId: poll.resultingGroupBookingId,
            };
        }),
    });
});

export { closePollWithWinner };
