import Show from '../models/Show.js';
import { logger } from '../configs/logger.js';
import { offerSeatsToWaitlist } from './waitlistOffers.js';

export const releaseSeatsAtomic = (showId, seats) =>
    Show.findByIdAndUpdate(showId, {
        $unset: Object.fromEntries(seats.map(seat => [`occupiedSeats.${seat}`, ""]))
    });

export const occupySeatsAtomic = (showId, seats, userId) =>
    Show.findByIdAndUpdate(showId, {
        $set: Object.fromEntries(seats.map(seat => [`occupiedSeats.${seat}`, userId]))
    });

export const getSeatCapacityInfo = (show) => {
    const occupiedCount = Object.keys(show.occupiedSeats || {}).length;
    const totalCapacity = show.screen.totalCapacity;
    return { occupiedCount, totalCapacity, isSoldOut: occupiedCount >= totalCapacity };
};

export const occupySeatsIfFree = (showId, seats, value) => {
    const seatList = Array.isArray(seats) ? seats : [seats];
    const conditions = seatList.map(seat => ({ [`occupiedSeats.${seat}`]: { $exists: false } }));
    const updates = Object.fromEntries(seatList.map(seat => [`occupiedSeats.${seat}`, value]));
    return Show.findOneAndUpdate({ _id: showId, $and: conditions }, { $set: updates }, { new: true });
};

export const releaseSeatsAndNotifyWaitlist = async (showId, seats) => {
    await releaseSeatsAtomic(showId, seats);
    try {
        await offerSeatsToWaitlist(showId, seats);
    } catch (err) {
        logger.error({ err, showId, seats }, 'Waitlist notify failed after seat release');
    }
};
