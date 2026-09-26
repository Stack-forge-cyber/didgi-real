export class ConfigValidationError extends Error {
    constructor(readonly details: unknown) {
        super('Invalid environment variables');
    }
}
