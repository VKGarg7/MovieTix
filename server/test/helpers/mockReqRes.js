import { vi } from 'vitest';

// Minimal mock logger matching the shape req.log has via pino-http in production.
export const createMockLogger = () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
});

// Builds a mock Express req for calling controllers directly, bypassing the
// HTTP layer and Clerk middleware — controllers only need req.auth(), req.body,
// req.params, req.headers, and req.log.
export const createMockReq = ({ userId, body = {}, params = {}, headers = {} } = {}) => ({
    auth: () => ({ userId }),
    body,
    params,
    headers,
    log: createMockLogger(),
});

// Builds a mock Express res that records what was sent, resolving a promise
// once .json() or .status().json() is called — lets tests await the
// controller's response instead of asserting on side effects only.
export const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: undefined,
    };
    res.status = vi.fn((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = vi.fn((payload) => {
        res.body = payload;
        return res;
    });
    return res;
};

// Runs an asyncHandler-wrapped controller and returns { statusCode, body },
// capturing thrown/next-forwarded errors the same way the real errorHandler would.
export const invokeController = async (controller, req) => {
    const res = createMockRes();
    let forwardedError = null;
    const next = (err) => { forwardedError = err; };

    await controller(req, res, next);

    if (forwardedError) {
        const statusCode = forwardedError.statusCode || 500;
        return {
            statusCode,
            body: {
                success: false,
                message: forwardedError.message,
                code: forwardedError.code || 'INTERNAL_ERROR',
            },
        };
    }

    return { statusCode: res.statusCode, body: res.body };
};
