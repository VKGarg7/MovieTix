export const PASSPORT_MILESTONES = [
    { theaterCount: 3, bonusPoints: 100 },
    { theaterCount: 5, bonusPoints: 250 },
    { theaterCount: 10, bonusPoints: 500 },
];

export const findNewlyReachedMilestones = (previousCount, newCount, alreadyReached) =>
    PASSPORT_MILESTONES.filter(m =>
        newCount >= m.theaterCount &&
        previousCount < m.theaterCount &&
        !alreadyReached.includes(m.theaterCount)
    );
