import { getSeatCapacityInfo } from './seatOperations.js';

export const FLASH_SEATS_WINDOW_HOURS = parseInt(process.env.FLASH_SEATS_WINDOW_HOURS, 10) || 3;
export const FLASH_SEATS_OCCUPANCY_THRESHOLD = parseFloat(process.env.FLASH_SEATS_OCCUPANCY_THRESHOLD) || 0.3;
export const FLASH_SEATS_DISCOUNT_PERCENT = parseInt(process.env.FLASH_SEATS_DISCOUNT_PERCENT, 10) || 30;

export const qualifiesForFlashSeats = (show, now = new Date()) => {
    if (show.isCancelled) return false;
    const startsInMs = show.showDateTime.getTime() - now.getTime();
    if (startsInMs <= 0 || startsInMs > FLASH_SEATS_WINDOW_HOURS * 60 * 60 * 1000) return false;

    const { occupiedCount, totalCapacity, isSoldOut } = getSeatCapacityInfo(show);
    if (isSoldOut || totalCapacity === 0) return false;

    return occupiedCount / totalCapacity < FLASH_SEATS_OCCUPANCY_THRESHOLD;
};
