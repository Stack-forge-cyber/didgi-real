import { AppError } from './app-error.js';

export const validationError = (details: unknown) =>
    new AppError('VALIDATION_ERROR', 'Request validation failed', 400, details);

export const userNotFoundError = (userId: bigint) =>
    new AppError('USER_NOT_FOUND', `User ${userId.toString()} was not found`, 404);

export const insufficientFundsError = () =>
    new AppError('INSUFFICIENT_FUNDS', 'Insufficient funds', 409);

export const idempotencyConflictError = () =>
    new AppError(
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key was already used with another amount',
        409
    );

export const databaseUnavailableError = () =>
    new AppError('DATABASE_UNAVAILABLE', 'Database is unavailable', 503);
