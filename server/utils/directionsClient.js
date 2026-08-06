import axios from 'axios';

const directions = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api',
});

export const estimateTravelMinutes = async ({ originLat, originLng, destLat, destLng }) => {
    if (!process.env.GOOGLE_DIRECTIONS_API_KEY) return null;

    try {
        const { data } = await directions.get('/directions/json', {
            params: {
                origin: `${originLat},${originLng}`,
                destination: `${destLat},${destLng}`,
                mode: 'driving',
                departure_time: 'now', 
                key: process.env.GOOGLE_DIRECTIONS_API_KEY,
            },
            timeout: 5000,
        });

        const leg = data?.routes?.[0]?.legs?.[0];
        const durationSeconds = leg?.duration_in_traffic?.value ?? leg?.duration?.value;
        if (data.status !== 'OK' || !Number.isFinite(durationSeconds)) return null;

        return Math.ceil(durationSeconds / 60);
    } catch {
        return null;
    }
};

export default directions;
