import 'reflect-metadata';

import { StandardSchemaValidationPipe } from '@nestjs/common/pipes/standard-schema-validation.pipe.js';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter.js';
import { HttpLoggingInterceptor } from './core/logging/http-logging.interceptor.js';
import { RequestIdMiddleware } from './core/logging/request-id.middleware.js';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
const config = app.get(ConfigService);

const requestIdMiddleware = new RequestIdMiddleware();
app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
app.useGlobalPipes(new StandardSchemaValidationPipe());
app.useGlobalFilters(new GlobalExceptionFilter());
app.useGlobalInterceptors(new HttpLoggingInterceptor());

const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
        .setTitle('Payment Balance Server')
        .setDescription('Atomic user balance debit API with PostgreSQL, Prisma and idempotency.')
        .setVersion('1.0.0')
        .addApiKey(
            {
                type: 'apiKey',
                name: 'Idempotency-Key',
                in: 'header',
                description: 'Optional key used to safely retry withdraw requests.',
            },
            'idempotency-key'
        )
        .build()
);

SwaggerModule.setup('/docs', app, document);

await app.listen(config.get<number>('app.port', { infer: true }));
