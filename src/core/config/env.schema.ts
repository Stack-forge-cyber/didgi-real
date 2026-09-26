import { z } from 'zod';

import { ConfigValidationError } from './config-validation.error.js';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type EnvValues = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): EnvValues => {
    const parsed = envSchema.safeParse(config);

    if (!parsed.success) {
        throw new ConfigValidationError(parsed.error.flatten());
    }

    return parsed.data;
};
