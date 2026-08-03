import crypto from 'crypto';

const sign = (payload) => {
    return crypto.createHmac('sha256', process.env.QR_TOKEN_SECRET).update(payload).digest('base64url');
};

export const createPickupToken = (bookingId) => {
    const payload = bookingId.toString();
    const signature = sign(payload);
    return `${payload}.${signature}`;
};

export const verifyPickupToken = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) return null;

    const [payload, signature] = token.split('.');
    const expectedSignature = sign(payload);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    return payload;
};
