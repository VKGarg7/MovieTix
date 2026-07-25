// Maps a thrown error to { statusCode, message, code }. Falls back to 500/generic message.
export function mapError(err) {
    if (err.isOperational) {
        return { statusCode: err.statusCode, message: err.message, code: err.code };
    }

    if (err.name === 'CastError') {
        return { statusCode: 400, message: `Invalid ${err.path}: ${err.value}`, code: 'INVALID_ID' };
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(e => e.message).join(', ');
        return { statusCode: 400, message, code: 'VALIDATION_ERROR' };
    }

    if (err.code === 11000) {
        return { statusCode: 409, message: 'Duplicate value violates a unique constraint', code: 'DUPLICATE_KEY' };
    }

    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
        return { statusCode: 400, message: 'Malformed JSON in request body', code: 'MALFORMED_JSON' };
    }

    if (err.name === 'StripeError' || err.type?.startsWith('Stripe')) {
        return { statusCode: 502, message: 'Payment gateway error', code: 'STRIPE_ERROR' };
    }

    if (err.name === 'UnauthorizedError' || err.status === 401) {
        return { statusCode: 401, message: 'Not authenticated', code: 'UNAUTHENTICATED' };
    }

    return { statusCode: 500, message: 'Internal server error', code: 'INTERNAL_ERROR' };
}

export const notFoundHandler = (req, res, _next) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
};

export const errorHandler = (err, req, res, _next) => {
    const { statusCode, message, code } = mapError(err);
    const log = req.log || console;
    const logMethod = statusCode >= 500 ? 'error' : 'warn';

    log[logMethod]({ err, requestId: req.id }, message);

    res.status(statusCode).json({
        success: false,
        message,
        code,
        requestId: req.id,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
    });
};
