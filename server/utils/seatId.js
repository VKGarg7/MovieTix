// Seat IDs are "<row letter><seat number>", e.g. "C7". Valid only if the row
// exists on the screen and the seat number is within that row's seatCount.
export const SEAT_ID_PATTERN = /^([A-Z])([1-9][0-9]?)$/;

// Builds a { rowLabel: seatCount } map from a screen's row config, so a seat
// like "C7" can be checked against that screen's actual layout instead of a
// hardcoded grid.
export const buildSeatCapacityByRow = (screen) =>
    new Map(screen.rows.map(row => [row.label.toUpperCase(), row.seatCount]));

export const isSeatValidForScreen = (seat, seatCapacityByRow) => {
    if (typeof seat !== 'string') return false;
    const match = SEAT_ID_PATTERN.exec(seat);
    if (!match) return false;

    const [, row, seatNumberStr] = match;
    const maxSeats = seatCapacityByRow.get(row);
    if (maxSeats === undefined) return false;

    return Number(seatNumberStr) <= maxSeats;
};

// Returns the subset of seatIds that do NOT fit the given screen's layout.
export const findSeatsOutsideLayout = (seatIds, screen) => {
    const seatCapacityByRow = buildSeatCapacityByRow(screen);
    return seatIds.filter(seatId => !isSeatValidForScreen(seatId, seatCapacityByRow));
};
