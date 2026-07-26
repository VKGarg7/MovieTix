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
