import swaggerJSDoc from 'swagger-jsdoc';

const errorExample = (message, code) => ({
    success: false,
    message,
    code,
    requestId: '3e418c6d-a587-4685-9d58-9c24b6a00214'
});

const definition = {
    openapi: '3.0.3',
    info: {
        title: 'MovieTix API',
        version: '1.0.0',
        description: 'API for browsing shows, booking seats, and administering the MovieTix platform. ' +
            'All error responses share a standard shape: `{ success: false, message, code, requestId }`.'
    },
    servers: [
        { url: '/api', description: 'Relative to whichever host is serving this app' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Clerk session token. Send as `Authorization: Bearer <token>`.'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' },
                    code: { type: 'string' },
                    requestId: { type: 'string' }
                }
            }
        },
        responses: {
            BadRequest: {
                description: 'Invalid request input',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Invalid input', 'INVALID_INPUT') } }
            },
            Unauthenticated: {
                description: 'Missing or invalid auth token',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Not authenticated', 'UNAUTHENTICATED') } }
            },
            Forbidden: {
                description: 'Authenticated but not authorized (e.g. non-admin)',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Not authorized', 'NOT_AUTHORIZED') } }
            },
            NotFound: {
                description: 'Resource not found',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Resource not found', 'NOT_FOUND') } }
            },
            Conflict: {
                description: 'Conflicting state (e.g. seats already taken)',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Selected seats are not available', 'SEATS_UNAVAILABLE') } }
            },
            TooManyRequests: {
                description: 'Rate limit exceeded',
                headers: {
                    'Retry-After': { schema: { type: 'integer' }, description: 'Seconds until the limit resets' }
                },
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Too many requests, please try again later.', 'RATE_LIMITED') } }
            },
            ServerError: {
                description: 'Unexpected server error',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: errorExample('Internal server error', 'INTERNAL_ERROR') } }
            }
        }
    }
};

// Scans routes/*.js for @openapi JSDoc comments. Only safe to call where the
// filesystem is reliably available (local dev, or the build-time script) —
// see scripts/generateSwaggerSpec.js and configs/swagger.js.
export const buildSwaggerSpec = () => swaggerJSDoc({
    definition,
    apis: ['./routes/*.js']
});
