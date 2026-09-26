import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export class RequestIdMiddleware {
    use(request: Request & { id?: string }, response: Response, next: NextFunction): void {
        const incoming = request.headers['x-request-id'];
        const requestId = Array.isArray(incoming) ? incoming[0] : incoming;

        request.id = requestId ?? randomUUID();
        response.setHeader('x-request-id', request.id);

        next();
    }
}
