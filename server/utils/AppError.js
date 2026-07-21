// Error class for expected/operational errors that should map to a specific HTTP status.
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
