import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import AppError from './AppError.js';

// Returns the list of Screen _ids belonging to a theater.
export const getScreenIdsForTheater = async (theaterId) => {
    const screens = await Screen.find({ theater: theaterId }, { _id: 1 });
    return screens.map(s => s._id);
};

// Returns the list of Show _ids (as strings) that belong to the given theater,
// via its screens. Used to scope Booking queries for theaterAdmins — Booking.show
// is a String ref, so these must be strings too (raw aggregation pipelines don't
// get Mongoose's automatic ObjectId<->String cast that .find() applies).
export const getShowIdsForTheater = async (theaterId) => {
    const screenIds = await getScreenIdsForTheater(theaterId);
    const shows = await Show.find({ screen: { $in: screenIds } }, { _id: 1 });
    return shows.map(s => s._id.toString());
};

// Throws a 403 if a theaterAdmin's adminContext doesn't own the given screen.
// No-op for superAdmins. Call after confirming the screen exists.
export const assertScreenBelongsToTheater = (screen, adminContext) => {
    const { role, theaterId } = adminContext;
    if (role === 'theaterAdmin' && screen.theater.toString() !== theaterId) {
        throw new AppError('This screen does not belong to your theater', 403, 'NOT_AUTHORIZED');
    }
};
