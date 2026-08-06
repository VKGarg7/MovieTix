import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import TrailerVote from '../models/TrailerVote.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { getBookableMovieIds } from '../utils/showQueries.js';
import { csvRow } from '../utils/csv.js';

const CANDIDATE_COUNT = 3;
const MIN_VOTES_FOR_RESULT = 3; 

const userHasBookingForShow = async (userId, showId) =>
    Boolean(await Booking.exists({ user: userId, show: showId, isPaid: true, status: { $ne: 'cancelled' } }));

const getOrCreateTrailerVote = async (showId) => {
    let vote = await TrailerVote.findOne({ show: showId });
    if (vote) return vote;

    const show = await Show.findById(showId);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const bookableMovieIds = await getBookableMovieIds();
    const otherMovieIds = bookableMovieIds.filter(id => id !== show.movie);
    const candidatesWithTrailers = await Movie.find(
        { _id: { $in: otherMovieIds }, trailerUrl: { $ne: null } },
        { _id: 1 }
    ).limit(CANDIDATE_COUNT * 3); 

    if (candidatesWithTrailers.length < 2) {
        throw new AppError('Not enough other upcoming movies with trailers to run a vote for this show', 409, 'INSUFFICIENT_CANDIDATES');
    }

    const shuffled = [...candidatesWithTrailers].sort(() => Math.random() - 0.5);
    const candidateMovieIds = shuffled.slice(0, CANDIDATE_COUNT).map(m => m._id);

    try {
        vote = await TrailerVote.create({ show: showId, candidateMovieIds });
    } catch (error) {
        if (error.code === 11000) {
            vote = await TrailerVote.findOne({ show: showId });
        } else {
            throw error;
        }
    }
    return vote;
};

const buildTally = (vote) => {
    const counts = new Map(vote.candidateMovieIds.map(id => [id, 0]));
    for (const v of vote.votes) {
        if (counts.has(v.choice)) counts.set(v.choice, counts.get(v.choice) + 1);
    }
    return counts;
};

const serializeVote = async (vote, userId) => {
    const movies = await Movie.find({ _id: { $in: vote.candidateMovieIds } }, { title: 1, poster_path: 1, trailerUrl: 1 });
    const movieById = new Map(movies.map(m => [m._id, m]));
    const tally = buildTally(vote);
    const totalVotes = vote.votes.length;

    const candidates = vote.candidateMovieIds.map(movieId => ({
        movieId,
        title: movieById.get(movieId)?.title || 'Unknown',
        poster_path: movieById.get(movieId)?.poster_path || null,
        trailerUrl: movieById.get(movieId)?.trailerUrl || null,
        votes: tally.get(movieId) || 0,
    }));

    const myVote = userId ? vote.votes.find(v => v.userId === userId)?.choice || null : null;
    const hasEnoughVotes = totalVotes >= MIN_VOTES_FOR_RESULT;
    const winner = hasEnoughVotes
        ? candidates.reduce((best, c) => (c.votes > (best?.votes ?? -1) ? c : best), null)
        : null;

    return { showId: vote.show, candidates, totalVotes, myVote, hasEnoughVotes, winner };
};

export const getTrailerVoteForShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;
    const { userId } = req.auth();

    const vote = await getOrCreateTrailerVote(showId);
    res.json({ success: true, ...(await serializeVote(vote, userId)) });
});

export const castTrailerVote = asyncHandler(async (req, res) => {
    const userId = req.auth().userId;
    const { showId } = req.params;
    const { choice } = req.body;

    if (!choice || typeof choice !== 'string') {
        throw new AppError('choice is required', 400, 'INVALID_INPUT');
    }

    const show = await Show.findById(showId);
    if (!show || show.showDateTime.getTime() <= Date.now()) {
        throw new AppError('Voting is closed for this show', 400, 'VOTING_CLOSED');
    }

    const eligible = await userHasBookingForShow(userId, showId);
    if (!eligible) {
        throw new AppError('You need a paid booking for this show to vote', 403, 'NOT_ELIGIBLE_TO_VOTE');
    }

    const vote = await getOrCreateTrailerVote(showId);
    if (!vote.candidateMovieIds.includes(choice)) {
        throw new AppError('choice must be one of the candidate trailers for this show', 400, 'INVALID_CHOICE');
    }

    const updated = await TrailerVote.findOneAndUpdate(
        { _id: vote._id, 'votes.userId': userId },
        { $set: { 'votes.$.choice': choice } },
        { new: true }
    );

    const finalVote = updated || await TrailerVote.findOneAndUpdate(
        { _id: vote._id, 'votes.userId': { $ne: userId } },
        { $push: { votes: { userId, choice } } },
        { new: true }
    ) || await TrailerVote.findById(vote._id); 

    req.log.info({ showId, userId, choice }, 'Trailer vote cast');
    res.json({ success: true, ...(await serializeVote(finalVote, userId)) });
});

export const exportTrailerVoteCsv = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    const vote = await TrailerVote.findOne({ show: showId });
    if (!vote) {
        throw new AppError('No trailer vote has been started for this show yet', 404, 'VOTE_NOT_FOUND');
    }

    const { candidates, totalVotes, hasEnoughVotes, winner } = await serializeVote(vote, null);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="trailer-vote-${showId}.csv"`);

    res.write(csvRow(['Show ID', 'Total Votes', 'Status', 'Winner']));
    res.write(csvRow([showId, totalVotes, hasEnoughVotes ? 'Closed' : 'Not enough votes', winner?.title || '']));
    res.write(csvRow([]));
    res.write(csvRow(['Candidate', 'Votes']));
    for (const c of candidates) {
        res.write(csvRow([c.title, c.votes]));
    }
    res.end();
});
