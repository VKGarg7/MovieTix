import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import MatchSession from '../models/MatchSession.js';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { getOrderedBookableMovieIds } from '../utils/showQueries.js';
import { findParticipantByName } from '../utils/participants.js';

const MIN_CANDIDATES = 2;
const MAX_CANDIDATES = 10;
const DEFAULT_SESSION_EXPIRY_HOURS = parseInt(process.env.MATCH_SESSION_DEFAULT_EXPIRY_HOURS, 10) || 48;
const MAX_SESSION_EXPIRY_HOURS = parseInt(process.env.MATCH_SESSION_MAX_EXPIRY_HOURS, 10) || 168;

const resolveCandidateMovieIds = async (theaterId) => {
    const movieOrder = await getOrderedBookableMovieIds(theaterId, { limit: MAX_CANDIDATES });
    return movieOrder.map(m => m._id);
};

const summarizeCandidate = (movie, votesFor) => ({
    movieId: movie._id,
    title: movie.title,
    poster_path: movie.poster_path,
    yesCount: votesFor[movie._id] || 0,
});

const countYesVotes = participants => participants.reduce((counts, participant) => {
    participant.swipes.forEach(swipe => {
        if (swipe.yes) counts[swipe.movieId] = (counts[swipe.movieId] || 0) + 1;
    });
    return counts;
}, {});

const isEveryoneFinished = (session) =>
    session.participants.length > 0 &&
    session.participants.every(p => p.swipes.length >= session.candidateMovieIds.length);

const computeMatchResult = (session) => {
    const yesCounts = countYesVotes(session.participants);
    const participantCount = session.participants.length;

    const fullMatches = session.candidateMovieIds
        .map(c => c.movie)
        .filter(movieId => (yesCounts[movieId] || 0) === participantCount);

    const ranked = session.candidateMovieIds
        .map(c => ({ movieId: c.movie, yesCount: yesCounts[c.movieId] || yesCounts[c.movie] || 0 }))
        .sort((a, b) => b.yesCount - a.yesCount);

    return { fullMatches, ranked, yesCounts };
};

export const createMatchSession = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { movieIds, theaterId, invitedCount, expiresInHours, organizerNote } = req.body;
    const { origin } = req.headers;

    if (!invitedCount || !Number.isInteger(invitedCount) || invitedCount < 1) {
        throw new AppError('invitedCount must be a positive integer', 400, 'INVALID_INPUT');
    }
    if (theaterId && !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('Invalid theaterId', 400, 'INVALID_INPUT');
    }

    let resolvedMovieIds = movieIds;
    if (!Array.isArray(resolvedMovieIds) || resolvedMovieIds.length === 0) {
        resolvedMovieIds = await resolveCandidateMovieIds(theaterId);
    }
    if (new Set(resolvedMovieIds).size !== resolvedMovieIds.length) {
        throw new AppError('Duplicate candidate movies', 400, 'INVALID_INPUT');
    }
    if (resolvedMovieIds.length < MIN_CANDIDATES || resolvedMovieIds.length > MAX_CANDIDATES) {
        throw new AppError(`Select between ${MIN_CANDIDATES} and ${MAX_CANDIDATES} candidate movies`, 400, 'INVALID_INPUT');
    }

    const movies = await Movie.find({ _id: { $in: resolvedMovieIds } });
    if (movies.length !== resolvedMovieIds.length) {
        throw new AppError('One or more candidate movies not found', 404, 'MOVIE_NOT_FOUND');
    }

    const hours = expiresInHours
        ? Math.min(Math.max(1, expiresInHours), MAX_SESSION_EXPIRY_HOURS)
        : DEFAULT_SESSION_EXPIRY_HOURS;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const session = await MatchSession.create({
        hostId: userId,
        theaterId: theaterId || null,
        candidateMovieIds: resolvedMovieIds.map(movie => ({ movie })),
        invitedCount,
        expiresAt,
        organizerNote: organizerNote || '',
    });

    await inngest.send({
        name: 'app/match-session.expire',
        data: { sessionId: session._id.toString(), expiresAt: expiresAt.toISOString() },
    });

    req.log.info({ sessionId: session._id.toString(), userId, candidateCount: resolvedMovieIds.length }, 'Match session created');
    res.json({
        success: true,
        sessionId: session._id,
        shareUrl: `${origin}/movie-match/${session._id}`,
        expiresAt,
    });
});

const withMovieDetails = async (session) => {
    const movies = await Movie.find({ _id: { $in: session.candidateMovieIds.map(c => c.movie) } });
    const movieById = new Map(movies.map(m => [m._id, m]));
    return { session, movieById };
};

export const getMatchSessionStatus = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const session = await MatchSession.findById(sessionId);
    if (!session) throw new AppError('Match session not found', 404, 'SESSION_NOT_FOUND');

    const { movieById } = await withMovieDetails(session);
    const yesCounts = countYesVotes(session.participants);
    const finishedCount = session.participants.filter(p => p.swipes.length >= session.candidateMovieIds.length).length;

    res.json({
        success: true,
        sessionId: session._id,
        status: session.status,
        expiresAt: session.expiresAt,
        organizerNote: session.organizerNote,
        invitedCount: session.invitedCount,
        joinedCount: session.participants.length,
        finishedCount,
        candidates: session.candidateMovieIds
            .map(c => movieById.get(c.movie))
            .filter(Boolean)
            .map(movie => summarizeCandidate(movie, yesCounts)),
        participantNames: session.participants.map(p => p.name),
        matchedMovieId: session.matchedMovieId,
        resultingShowtimePollId: session.resultingShowtimePollId,
        resultingGroupBookingId: session.resultingGroupBookingId,
    });
});

export const joinMatchSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new AppError('name is required', 400, 'INVALID_INPUT');
    }

    const session = await MatchSession.findById(sessionId);
    if (!session) throw new AppError('Match session not found', 404, 'SESSION_NOT_FOUND');
    if (session.status !== 'active') throw new AppError('This match session is no longer active', 409, 'SESSION_INACTIVE');

    const trimmedName = name.trim();
    let participant = findParticipantByName(session.participants, trimmedName);
    if (!participant) {
        session.participants.push({ name: trimmedName, swipes: [] });
        await session.save();
        participant = findParticipantByName(session.participants, trimmedName);
    }

    res.json({
        success: true,
        candidateMovieIds: session.candidateMovieIds.map(c => c.movie),
        swipedMovieIds: participant.swipes.map(s => s.movieId),
    });
});

export const swipeOnMatchSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { name, movieId, yes } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new AppError('name is required', 400, 'INVALID_INPUT');
    }
    if (!movieId) throw new AppError('movieId is required', 400, 'INVALID_INPUT');
    if (typeof yes !== 'boolean') throw new AppError('yes must be a boolean', 400, 'INVALID_INPUT');

    const session = await MatchSession.findById(sessionId);
    if (!session) throw new AppError('Match session not found', 404, 'SESSION_NOT_FOUND');
    if (session.status !== 'active') throw new AppError('This match session is no longer active', 409, 'SESSION_INACTIVE');
    if (session.expiresAt.getTime() < Date.now()) throw new AppError('This match session has expired', 409, 'SESSION_EXPIRED');

    if (!session.candidateMovieIds.some(c => c.movie === movieId)) {
        throw new AppError('That movie is not a candidate in this session', 400, 'INVALID_CANDIDATE');
    }

    const trimmedName = name.trim();
    let participant = findParticipantByName(session.participants, trimmedName);
    if (!participant) {
        session.participants.push({ name: trimmedName, swipes: [] });
        participant = session.participants[session.participants.length - 1];
        session.invitedCount = Math.max(session.invitedCount, session.participants.length);
    }

    const existingSwipe = participant.swipes.find(s => s.movieId === movieId);
    if (existingSwipe) {
        existingSwipe.yes = yes;
    } else {
        participant.swipes.push({ movieId, yes });
    }

    const allFinished = isEveryoneFinished(session);
    await session.save();

    req.log.info({ sessionId, name: trimmedName, movieId, yes }, 'Swipe recorded on match session');

    if (allFinished && session.participants.length >= 2) {
        await tryAutoClose(session._id, req.log);
    }

    res.json({ success: true });
});

const tryAutoClose = async (sessionId, log) => {
    const session = await MatchSession.findById(sessionId);
    if (!session || session.status !== 'active') return;
    if (!isEveryoneFinished(session)) return;

    const { fullMatches, ranked } = computeMatchResult(session);
    const matchedMovieId = fullMatches[0] || null;

    session.status = 'closed';
    session.matchedMovieId = matchedMovieId;
    await session.save();

    log?.info({ sessionId: session._id.toString(), matchedMovieId, hasFullMatch: fullMatches.length > 0, topRanked: ranked[0]?.movieId }, 'Match session closed');
};

export const closeMatchSession = asyncHandler(async (req, res) => {
    const { userId } = req.auth();
    const { sessionId } = req.params;

    const session = await MatchSession.findById(sessionId);
    if (!session) throw new AppError('Match session not found', 404, 'SESSION_NOT_FOUND');
    if (session.hostId !== userId) throw new AppError('Not authorized to close this session', 403, 'NOT_AUTHORIZED');
    if (session.status !== 'active') throw new AppError('This session is already closed', 409, 'SESSION_INACTIVE');

    const { fullMatches, ranked } = computeMatchResult(session);
    const matchedMovieId = fullMatches[0] || null;

    session.status = 'closed';
    session.matchedMovieId = matchedMovieId;
    await session.save();

    req.log.info({ sessionId, matchedMovieId, hasFullMatch: fullMatches.length > 0 }, 'Match session closed by host');

    res.json({
        success: true,
        matchedMovieId,
        fullMatches,
        ranked,
    });
});

export const getMyMatchSessions = asyncHandler(async (req, res) => {
    const { userId } = req.auth();

    const sessions = await MatchSession.find({ hostId: userId }).sort({ createdAt: -1 });

    res.json({
        success: true,
        sessions: await Promise.all(sessions.map(async (session) => {
            const { movieById } = await withMovieDetails(session);
            const yesCounts = countYesVotes(session.participants);
            const finishedCount = session.participants.filter(p => p.swipes.length >= session.candidateMovieIds.length).length;
            return {
                sessionId: session._id,
                status: session.status,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                invitedCount: session.invitedCount,
                joinedCount: session.participants.length,
                finishedCount,
                candidates: session.candidateMovieIds
                    .map(c => movieById.get(c.movie))
                    .filter(Boolean)
                    .map(movie => summarizeCandidate(movie, yesCounts)),
                matchedMovieId: session.matchedMovieId,
            };
        })),
    });
});
