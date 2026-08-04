// Scores each contiguous run of `count` unoccupied seats within a row by
// proximity to the screen's horizontal/vertical center, and returns the
// highest-scoring run. Falls back to the largest available contiguous run
// (across all rows) if no run of the requested size exists.
//
// rows: [{ label, seatCount, seatType }], top-to-bottom order (row index ==
// vertical position). Seat IDs are `${label}${1..seatCount}` (seat number ==
// horizontal position) — same convention as seatId.js on the server.
export const findBestAvailableSeats = (rows, count, occupiedSeats) => {
    if (!Array.isArray(rows) || rows.length === 0 || count < 1) {
        return { seats: [], isFullMatch: false };
    }

    const occupied = new Set(occupiedSeats);
    const rowCount = rows.length;
    const verticalCenter = (rowCount - 1) / 2;

    let bestRun = null; // { seats, score }
    let largestRun = null; // longest contiguous run found, any size, for the fallback

    rows.forEach((row, rowIndex) => {
        const seatCount = row.seatCount;
        const horizontalCenter = (seatCount - 1) / 2;
        const rowDistanceFromCenter = Math.abs(rowIndex - verticalCenter);

        let runStart = null; // 1-based seat number where the current free run began

        const closeRun = (runEndInclusive) => {
            if (runStart === null) return;
            const runLength = runEndInclusive - runStart + 1;

            if (!largestRun || runLength > largestRun.length) {
                largestRun = { length: runLength, seats: seatsInRun(row.label, runStart, runEndInclusive) };
            }

            if (runLength >= count) {
                // Slide a window of exactly `count` seats across this run and
                // score each position — the middle of a long run scores best
                // horizontally, so we can't just take the run's edges.
                for (let start = runStart; start + count - 1 <= runEndInclusive; start++) {
                    const end = start + count - 1;
                    const windowCenter = (start + end) / 2 - 1; // 0-based seat position
                    const horizontalDistance = Math.abs(windowCenter - horizontalCenter);
                    // Vertical proximity dominates (rows differ more than a
                    // single seat's horizontal offset would), then horizontal.
                    const score = rowDistanceFromCenter * 1000 + horizontalDistance;

                    if (!bestRun || score < bestRun.score) {
                        bestRun = { score, seats: seatsInRun(row.label, start, end) };
                    }
                }
            }
        };

        for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
            const seatId = `${row.label}${seatNum}`;
            if (occupied.has(seatId)) {
                closeRun(seatNum - 1);
                runStart = null;
            } else if (runStart === null) {
                runStart = seatNum;
            }
        }
        closeRun(seatCount);
    });

    if (bestRun) {
        return { seats: bestRun.seats, isFullMatch: true };
    }
    return { seats: largestRun ? largestRun.seats : [], isFullMatch: false };
};

const seatsInRun = (label, start, end) => {
    const seats = [];
    for (let n = start; n <= end; n++) seats.push(`${label}${n}`);
    return seats;
};
