import { DateTime } from 'luxon';

export const formatInZone = (dateLike, zone) => {
    const dt = DateTime.fromJSDate(new Date(dateLike), { zone: zone || 'utc' });
    return {
        date: dt.toFormat('cccc, LLLL d, yyyy'),
        time: dt.toFormat('h:mm a'),
    };
};
