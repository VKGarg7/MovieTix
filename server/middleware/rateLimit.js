import rateLimit from 'express-rate-limit';
import AppError from '../utils/AppError.js';

const minutes = n => n * 60 * 1000;

const toInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// IP-based limiters for public (unauthenticated) endpoints. Thresholds are
// environment-configurable so staging/production/partner allowlists can differ
// without a code change.
//
// Caveat on serverless (Vercel): the default store is in-memory per function
// instance, so limits reset on cold start and aren't shared across concurrent
// instances — this bounds abuse per-instance rather than enforcing a hard
// global cap. If that gap matters, swap in a shared store (e.g. Redis via
// rate-limit-redis) using the same RATE_LIMIT_* env vars.
const buildLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true, // adds RateLimit-* headers
    legacyHeaders: false,
    handler: (req, res, next) => {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);
        next(new AppError(message, 429, 'RATE_LIMITED'));
    },
    // Trusted partners/corporate NATs can be exempted via a comma-separated
    // list of IPs in RATE_LIMIT_ALLOWLIST (e.g. "203.0.113.4,203.0.113.5").
    skip: (req) => {
        const allowlist = (process.env.RATE_LIMIT_ALLOWLIST || '')
            .split(',')
            .map(ip => ip.trim())
            .filter(Boolean);
        return allowlist.includes(req.ip);
    }
});

export const publicApiLimiter = buildLimiter({
    windowMs: minutes(toInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MIN, 1)),
    max: toInt(process.env.RATE_LIMIT_PUBLIC_MAX, 60),
    message: 'Too many requests, please try again later.'
});

// Seat-polling is the most scrapable/DoS-able route, so it gets its own,
// stricter limit independent of the general public limiter.
export const seatPollingLimiter = buildLimiter({
    windowMs: minutes(toInt(process.env.RATE_LIMIT_SEATS_WINDOW_MIN, 1)),
    max: toInt(process.env.RATE_LIMIT_SEATS_MAX, 30),
    message: 'Too many seat-availability requests, please slow down.'
});

export const groupStatusPollingLimiter = buildLimiter({
    windowMs: minutes(toInt(process.env.RATE_LIMIT_GROUP_STATUS_WINDOW_MIN, 1)),
    max: toInt(process.env.RATE_LIMIT_GROUP_STATUS_MAX, 30),
    message: 'Too many group-booking status requests, please slow down.'
});
