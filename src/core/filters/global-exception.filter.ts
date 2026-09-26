import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppError, type AppErrorCode } from '../errors/app-error.js';

type AppErrorShape = {
    code: AppErrorCode;
    details?: unknown;
    message: string;
    statusCode: number;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request & { id?: string }>();
        const response = context.getResponse<Response>();
        const appError = this.getAppError(exception);
        const statusCode = this.getStatusCode(exception);
        const code = appError ? appError.code : this.getErrorCode(statusCode);
        const message = exception instanceof Error ? exception.message : 'Internal server error';
        const requestId = request.id ?? request.headers['x-request-id'];

        response.status(statusCode).json({
            code,
            message:
                statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
            requestId: Array.isArray(requestId) ? requestId[0] : requestId,
            ...(appError?.details ? { details: appError.details } : {}),
        });
    }

    private getStatusCode(exception: unknown): number {
        const appError = this.getAppError(exception);
        if (appError) {
            return appError.statusCode;
        }

        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private getAppError(exception: unknown): AppErrorShape | undefined {
        if (exception instanceof AppError) {
            return exception;
        }

        if (!exception || typeof exception !== 'object') {
            return undefined;
        }

        const candidate = exception as Partial<AppErrorShape>;
        if (
            typeof candidate.code === 'string' &&
            typeof candidate.message === 'string' &&
            typeof candidate.statusCode === 'number'
        ) {
            return candidate as AppErrorShape;
        }

        return undefined;
    }

    private getErrorCode(statusCode: number): string {
        if (statusCode === HttpStatus.BAD_REQUEST) {
            return 'VALIDATION_ERROR';
        }

        return statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
    }
}
