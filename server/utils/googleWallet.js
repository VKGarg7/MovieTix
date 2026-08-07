import jwt from 'jsonwebtoken';
import axios from 'axios';
import { logger } from '../configs/logger.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import { SCREEN_WITH_THEATER } from './theaterScope.js';
import { isMysteryRevealed } from './mysteryMovie.js';
import { createPickupToken } from './pickupToken.js';

const WALLET_API_BASE = 'https://walletobjects.googleapis.com/walletobjects/v1';
const CLASS_SUFFIX = 'movietix_ticket_class';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

const getServiceAccount = () => {
    if (!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT) return null;
    try {
        return JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
    } catch {
        logger.error('GOOGLE_WALLET_SERVICE_ACCOUNT is not valid JSON; Google Wallet passes are disabled');
        return null;
    }
};

export const isGoogleWalletConfigured = () =>
    Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && getServiceAccount());

const getAccessToken = async (serviceAccount) => {
    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
        { iss: serviceAccount.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
        serviceAccount.private_key,
        { algorithm: 'RS256' }
    );

    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
    });
    return data.access_token;
};

const classId = (issuerId) => `${issuerId}.${CLASS_SUFFIX}`;
const objectId = (issuerId, bookingId) => `${issuerId}.booking_${bookingId}`;

const buildTicketClass = (issuerId) => ({
    id: classId(issuerId),
    issuerName: 'MovieTix',
    eventName: { defaultValue: { language: 'en-US', value: 'Movie Ticket' } },
    reviewStatus: 'UNDER_REVIEW',
});

const buildTicketObject = ({ issuerId, booking, movieTitle, theater, showDateTime, seats, qrValue, state }) => {
    const object = {
        id: objectId(issuerId, booking._id.toString()),
        classId: classId(issuerId),
        state: state || 'ACTIVE',
        textModulesData: [
            { header: 'Seats', body: seats.join(', ') },
            { header: 'Theater', body: theater?.name || 'Theater TBD' },
        ],
        barcode: { type: 'QR_CODE', value: qrValue, alternateText: booking._id.toString() },
        ticketNumber: booking._id.toString(),
        eventName: { defaultValue: { language: 'en-US', value: movieTitle } },
        dateTime: { start: new Date(showDateTime).toISOString() },
    };
    if (theater) object.venue = { name: { defaultValue: { language: 'en-US', value: theater.name } } };
    return object;
};

export const upsertGoogleWalletPass = async ({ booking, movieTitle, theater, showDateTime, seats, qrValue, state }) => {
    const serviceAccount = getServiceAccount();
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    if (!serviceAccount || !issuerId) return null;

    try {
        const accessToken = await getAccessToken(serviceAccount);
        const headers = { Authorization: `Bearer ${accessToken}` };

        await axios.post(`${WALLET_API_BASE}/eventTicketClass`, buildTicketClass(issuerId), { headers })
            .catch(err => { if (err.response?.status !== 409) throw err; }); // 409 = class already exists

        const ticketObject = buildTicketObject({ issuerId, booking, movieTitle, theater, showDateTime, seats, qrValue, state });

        const patched = await axios.patch(
            `${WALLET_API_BASE}/eventTicketObject/${objectId(issuerId, booking._id.toString())}`,
            ticketObject,
            { headers }
        ).catch(async (err) => {
            if (err.response?.status !== 404) throw err;
            return axios.post(`${WALLET_API_BASE}/eventTicketObject`, ticketObject, { headers });
        });

        return patched.data;
    } catch (error) {
        logger.error({ err: error.response?.data || error.message, bookingId: booking._id.toString() }, 'Google Wallet pass upsert failed');
        return null;
    }
};

export const buildSaveToGoogleWalletUrl = (ticketObject) => {
    const serviceAccount = getServiceAccount();
    if (!serviceAccount || !ticketObject) return null;

    const claims = {
        iss: serviceAccount.client_email,
        aud: 'google',
        typ: 'savetowallet',
        payload: { eventTicketObjects: [ticketObject] },
    };
    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
};

export const buildGoogleWalletSaveUrlForBooking = async (booking) => {
    if (!isGoogleWalletConfigured() || !booking.isPaid) return null;

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show) return null;
    const movie = await Movie.findById(show.movie);
    if (!movie) return null;

    const revealed = isMysteryRevealed(show, { isPaid: booking.isPaid });
    const movieTitle = revealed ? movie.title : 'Mystery Movie';
    const qrValue = createPickupToken(booking._id.toString(), booking.ticketNonce);

    const ticketObject = await upsertGoogleWalletPass({
        booking,
        movieTitle,
        theater: show.screen?.theater,
        showDateTime: show.showDateTime,
        seats: booking.bookedSeats,
        qrValue,
    });
    if (!ticketObject) return null;

    return buildSaveToGoogleWalletUrl(ticketObject);
};

export const invalidateGoogleWalletPass = async (bookingId) => {
    const serviceAccount = getServiceAccount();
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    if (!serviceAccount || !issuerId) return;

    const accessToken = await getAccessToken(serviceAccount);
    await axios.patch(
        `${WALLET_API_BASE}/eventTicketObject/${objectId(issuerId, bookingId)}`,
        { state: 'INACTIVE' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
};
