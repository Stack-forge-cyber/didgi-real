import { existsSync } from 'node:fs';

export const getEnvFilePaths = (nodeEnv = process.env['NODE_ENV'] ?? 'development'): string[] => [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env',
];

export const getEnvFilePath = (): string | undefined => {
    return getEnvFilePaths().find((path) => existsSync(path));
};
