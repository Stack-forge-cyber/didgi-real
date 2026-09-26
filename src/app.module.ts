import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './core/config/configuration.js';
import { getEnvFilePath } from './core/config/env-files.js';
import { validateEnv } from './core/config/env.schema.js';
import { HealthModule } from './modules/health/health.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: getEnvFilePath(),
            expandVariables: true,
            validate: validateEnv,
            load: [configuration],
        }),
        HealthModule,
        UsersModule,
        PaymentsModule,
    ],
})
export class AppModule {}
