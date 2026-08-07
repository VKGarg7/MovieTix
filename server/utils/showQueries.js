import mongoose from 'mongoose';
import Show from '../models/Show.js';

export const bookableShowFilter = () => ({ showDateTime: { $gte: new Date() }, isCancelled: { $ne: true } });

export const getBookableMovieIds = () => Show.distinct('movie', bookableShowFilter());

export const getOrderedBookableMovieIds = async (theaterId, { limit } = {}) => {
    const pipeline = [{ $match: bookableShowFilter() }];

    if (theaterId) {
        pipeline.push(
            { $lookup: { from: 'screens', localField: 'screen', foreignField: '_id', as: 'screen' } },
            { $unwind: '$screen' },
            { $match: { 'screen.theater': new mongoose.Types.ObjectId(theaterId) } }
        );
    }

    pipeline.push(
        {
            $group: {
                _id: '$movie',
                earliestShow: { $min: '$showDateTime' },
                allMysteryUnrevealed: { $min: '$isMysteryMovie' },
                hasRelaxedScreening: { $max: '$isRelaxedScreening' },
            },
        },
        { $sort: { earliestShow: 1 } },
    );
    if (limit) pipeline.push({ $limit: limit });

    return Show.aggregate(pipeline);
};
