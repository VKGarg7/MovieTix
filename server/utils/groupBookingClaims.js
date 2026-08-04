import GroupBooking from '../models/GroupBooking.js';

export const updateClaimsForSeats = (groupBookingId, seats, fieldsToSet, { extraArrayFilterFields, filter } = {}) => {
    const arrayFilters = seats.map((seat, i) => ({
        [`elem${i}.seat`]: seat,
        ...Object.fromEntries(Object.entries(extraArrayFilterFields || {}).map(([field, value]) => [`elem${i}.${field}`, value])),
    }));

    const setPayload = {};
    seats.forEach((seat, i) => {
        for (const [field, value] of Object.entries(fieldsToSet)) {
            setPayload[`claims.$[elem${i}].${field}`] = value;
        }
    });

    return GroupBooking.findOneAndUpdate(
        { _id: groupBookingId, ...(filter || {}) },
        { $set: setPayload },
        { arrayFilters, new: true }
    );
};

// Reverts a set of claimed seats back to unclaimed — used both when a
// checkout attempt for a claim fails (revert just those seats) and when an
// abandoned claim booking expires unpaid (server/inngest/index.js).
export const revertClaimsToUnclaimed = (groupBookingId, seats) =>
    updateClaimsForSeats(groupBookingId, seats, { userId: null, bookingId: null, claimedAt: null });
