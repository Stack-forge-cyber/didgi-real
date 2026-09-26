import { envSchema } from './env.schema.js';

export default () => {
    const env = envSchema.parse(process.env);

    return {
        app: {
            nodeEnv: env.NODE_ENV,
            port: env.PORT,
            logLevel: env.LOG_LEVEL,
        },
        database: {
            url: env.DATABASE_URL,
        },
    };
};
