import QRCode from 'qrcode';
import AppError from './AppError.js';
import { createPickupToken } from './pickupToken.js';

export const buildPickupQrPng = async (bookingId) => {
    const token = createPickupToken(bookingId);
    try {
        return await QRCode.toBuffer(token, { type: 'png', width: 300, margin: 2 });
    } catch {
        throw new AppError('Failed to generate pickup QR code', 500, 'QR_GENERATION_FAILED');
    }
};
