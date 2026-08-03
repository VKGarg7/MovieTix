import mongoose from 'mongoose';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import AppError from './AppError.js';

export const SCREEN_WITH_THEATER = { path: 'screen', populate: { path: 'theater' } };

export const getScreenIdsForTheater = async (theaterId) => {
    const screens = await Screen.find({ theater: theaterId }, { _id: 1 });
    return screens.map(s => s._id);
};

export const getShowIdsForTheater = async (theaterId) => {
    const screenIds = await getScreenIdsForTheater(theaterId);
    const shows = await Show.find({ screen: { $in: screenIds } }, { _id: 1 });
    return shows.map(s => s._id.toString());
};


export const hasPaidBookings = async (showId) =>
    (await Booking.countDocuments({ show: showId.toString(), isPaid: true })) > 0;

export const assertScreenBelongsToTheater = (screen, adminContext) => {
    const { role, theaterId } = adminContext;
    const screenTheaterId = (screen.theater._id ?? screen.theater).toString();
    if (role === 'theaterAdmin' && screenTheaterId !== theaterId) {
        throw new AppError('This screen does not belong to your theater', 403, 'NOT_AUTHORIZED');
    }
};

export const loadTheaterScopedResource = async (Model, id, adminContext, resourceLabel) => {
    const resource = await Model.findById(id);
    if (!resource) {
        throw new AppError(`${resourceLabel} not found`, 404, `${resourceLabel.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`);
    }
    if (adminContext.role === 'theaterAdmin' && (!resource.theaterId || resource.theaterId.toString() !== adminContext.theaterId)) {
        throw new AppError(`This ${resourceLabel.toLowerCase()} does not belong to your theater`, 403, 'NOT_AUTHORIZED');
    }
    return resource;
};

export const resolveTheaterIdForCreate = (adminContext, requestedTheaterId, { allowNullForSuperAdmin = false } = {}) => {
    const { role, theaterId } = adminContext;
    if (role === 'theaterAdmin') return theaterId;

    if (!requestedTheaterId) {
        if (allowNullForSuperAdmin) return null;
        throw new AppError('A valid theaterId is required', 400, 'INVALID_INPUT');
    }
    if (!mongoose.Types.ObjectId.isValid(requestedTheaterId)) {
        throw new AppError('A valid theaterId is required', 400, 'INVALID_INPUT');
    }
    return requestedTheaterId;
};
