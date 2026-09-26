export type AppErrorCode =
    | 'VALIDATION_ERROR'
    | 'USER_NOT_FOUND'
    | 'INSUFFICIENT_FUNDS'
    | 'IDEMPOTENCY_CONFLICT'
    | 'DATABASE_UNAVAILABLE'
    | 'INTERNAL_ERROR';

export class AppError extends Error {
    constructor(
        readonly code: AppErrorCode,
        message: string,
        readonly statusCode: number,
        readonly details?: unknown
    ) {
        super(message);
    }
}
