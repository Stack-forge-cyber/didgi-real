import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service.js';
import { databaseUnavailableError } from '../../core/errors/domain-errors.js';

@Injectable()
export class HealthService {
    constructor(private readonly prisma: PrismaService) {}

    async checkDatabase(): Promise<void> {
        try {
            const plan = this.prisma.db.raw.sql`SELECT 1 AS ok`
                .returnsRow({ ok: 'pg/int4@1' })
                .build();
            await this.prisma.query<{ ok: number }>(plan);
        } catch {
            throw databaseUnavailableError();
        }
    }
}
