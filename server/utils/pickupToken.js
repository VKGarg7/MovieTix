import crypto from 'crypto';

const sign = (payload) => {
    return crypto.createHmac('sha256', process.env.QR_TOKEN_SECRET).update(payload).digest('base64url');
};

export const createPickupToken = (bookingId, ticketNonce) => {
    const payload = `${bookingId}.${ticketNonce}`;
    const signature = sign(payload);
    return `${payload}.${signature}`;
};

export const verifyPickupToken = (token) => {
    if (typeof token !== 'string') return null;

    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;

    const payload = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);
    const [bookingId, ticketNonce] = payload.split('.');
    if (!bookingId || !ticketNonce) return null;

    const expectedSignature = sign(payload);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    return { bookingId, ticketNonce };
};
