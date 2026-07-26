import Show from '../models/Show.js';

export const releaseSeatsAtomic = (showId, seats) =>
    Show.findByIdAndUpdate(showId, {
        $unset: Object.fromEntries(seats.map(seat => [`occupiedSeats.${seat}`, ""]))
    });

export const occupySeatsAtomic = (showId, seats, userId) =>
    Show.findByIdAndUpdate(showId, {
        $set: Object.fromEntries(seats.map(seat => [`occupiedSeats.${seat}`, userId]))
    });
