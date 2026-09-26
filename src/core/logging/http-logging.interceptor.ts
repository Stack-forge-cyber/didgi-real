import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { AppError } from '../errors/app-error.js';

type RequestWithId = Request & { id?: string };

type LogRecord = Record<string, unknown>;

const SENSITIVE_KEYS = new Set(['authorization', 'cookie', 'password', 'token', 'refreshToken']);

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = context.switchToHttp();
        const request = http.getRequest<RequestWithId>();
        const response = http.getResponse<Response>();
        const startedAt = Date.now();
        const baseRecord = this.getBaseRecord(request);

        this.log('log', {
            event: 'http.request',
            ...baseRecord,
            params: this.sanitize(request.params),
            query: this.sanitize(request.query),
            body: this.sanitize(request.body),
            idempotencyKey: this.getHeader(request, 'idempotency-key'),
        });

        return next.handle().pipe(
            tap((responseBody) => {
                this.log('log', {
                    event: 'http.response',
                    ...baseRecord,
                    statusCode: response.statusCode,
                    durationMs: Date.now() - startedAt,
                    response: this.sanitize(responseBody),
                });
            }),
            catchError((error: unknown) => {
                this.log('error', {
                    event: 'http.error',
                    ...baseRecord,
                    statusCode: this.getErrorStatusCode(error),
                    durationMs: Date.now() - startedAt,
                    error: this.getErrorRecord(error),
                });

                return throwError(() => error);
            })
        );
    }

    private getBaseRecord(request: RequestWithId): LogRecord {
        return {
            requestId: request.id ?? this.getHeader(request, 'x-request-id'),
            method: request.method,
            path: request.originalUrl,
        };
    }

    private getErrorRecord(error: unknown): LogRecord {
        if (error instanceof AppError) {
            return {
                type: error.name,
                code: error.code,
                message: error.message,
                details: this.sanitize(error.details),
            };
        }

        if (error instanceof HttpException) {
            const response = error.getResponse();

            return {
                type: error.name,
                code: this.getHttpErrorCode(response),
                message: error.message,
                details: this.sanitize(response),
            };
        }

        if (error instanceof Error) {
            return {
                type: error.name,
                message: error.message,
            };
        }

        return {
            type: typeof error,
            message: 'Unknown error',
            details: this.sanitize(error),
        };
    }

    private getErrorStatusCode(error: unknown): number {
        if (error instanceof AppError) {
            return error.statusCode;
        }

        if (error instanceof HttpException) {
            return error.getStatus();
        }

        return 500;
    }

    private getHttpErrorCode(response: string | object): unknown {
        if (typeof response !== 'object' || response === null || !('code' in response)) {
            return undefined;
        }

        return response.code;
    }

    private getHeader(request: Request, name: string): string | undefined {
        const value = request.headers[name];
        return Array.isArray(value) ? value[0] : value;
    }

    private sanitize(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.sanitize(item));
        }

        if (typeof value === 'object') {
            const result: Record<string, unknown> = {};

            for (const [key, entryValue] of Object.entries(value)) {
                result[key] = SENSITIVE_KEYS.has(key) ? '[redacted]' : this.sanitize(entryValue);
            }

            return result;
        }

        return value;
    }

    private log(level: 'log' | 'error', record: LogRecord): void {
        this.logger[level](JSON.stringify(record));
    }
}
