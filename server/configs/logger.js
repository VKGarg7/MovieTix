import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

// Serverless (Vercel) runtimes can't reliably spawn pino's worker-thread
// transport, so pretty-printing is opt-in for local dev only.
const isServerless = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === 'production';
const usePrettyPrint = !isProduction && !isServerless;

export const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    transport: usePrettyPrint ? { target: 'pino-pretty' } : undefined
});

export const httpLogger = pinoHttp({
    logger,
    genReqId: (req, res) => {
        const existingId = req.headers['x-request-id'];
        const id = existingId || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
    },
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        // seat polling is high-volume; keep it out of info-level noise
        if (req.url?.startsWith('/api/booking/seats/')) return 'debug';
        return 'info';
    }
});
