import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from '@prisma/orm-postgres/runtime';

import 'temporal-polyfill/global';

import type { Contract } from '../../../prisma/generated/prisma8/contract.js';
import contractJson from '../../../prisma/generated/prisma8/contract.json' with { type: 'json' };

type Prisma8Client = ReturnType<typeof postgres<Contract>>;

type QueryPlan = Parameters<ReturnType<Prisma8Client['runtime']>['query']>[0];
type ExecutePlan = Parameters<ReturnType<Prisma8Client['runtime']>['execute']>[0];

export type Prisma8Transaction = {
    orm: Prisma8Client['orm'];
    query(plan: unknown): AsyncIterable<unknown>;
    execute(plan: unknown): Promise<{ affectedRows: number }>;
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    readonly db: Prisma8Client;

    constructor(@Inject(ConfigService) config: ConfigService) {
        this.db = postgres<Contract>({
            contractJson,
            url: config.getOrThrow<string>('database.url'),
        });
    }

    async onModuleInit(): Promise<void> {
        await this.db.connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.db.close();
    }

    async query<TRow>(plan: QueryPlan): Promise<TRow[]> {
        const result = this.db.runtime().query(plan) as AsyncIterable<TRow>;
        const rows: TRow[] = [];

        for await (const row of result) {
            rows.push(row);
        }

        return rows;
    }

    execute(plan: ExecutePlan): Promise<{ affectedRows: number }> {
        return this.db.runtime().execute(plan) as Promise<{ affectedRows: number }>;
    }

    transaction<TResult>(callback: (tx: Prisma8Transaction) => Promise<TResult>): Promise<TResult> {
        return this.db.transaction(callback as never);
    }
}
