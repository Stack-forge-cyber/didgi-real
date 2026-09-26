import { Inject, Injectable } from '@nestjs/common';

import { type Prisma8Transaction, PrismaService } from '../../core/database/prisma.service.js';

export type UserBalanceRow = {
    id: bigint;
    balanceCents: bigint;
};

export type HistoryPagination = {
    limit: number;
    offset: number;
};

export type HistoryRow = {
    id: string;
    userId: bigint;
    action: string;
    amountCents: bigint;
    balanceBeforeCents: bigint;
    balanceAfterCents: bigint;
    idempotencyKey: string | null;
    createdAt: { toString(): string };
};

export type PaginatedHistoryRows = {
    items: HistoryRow[];
    total: number;
};

@Injectable()
export class UsersRepository {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async findBalance(userId: bigint): Promise<UserBalanceRow | null> {
        return this.prisma.db.orm.public.User.select('id', 'balanceCents').first({ id: userId });
    }

    async exists(userId: bigint): Promise<boolean> {
        const user = await this.prisma.db.orm.public.User.select('id').first({ id: userId });
        return Boolean(user);
    }

    async findHistory(
        userId: bigint,
        pagination: HistoryPagination
    ): Promise<PaginatedHistoryRows> {
        return this.prisma.transaction(async (tx) => {
            const [items, stats] = await Promise.all([
                this.selectHistory(tx, userId)
                    .orderBy((history) => history.createdAt.desc())
                    .offset(pagination.offset)
                    .limit(pagination.limit)
                    .all(),
                tx.orm.public.BalanceHistory.where({ userId }).aggregate((aggregate) => ({
                    total: aggregate.count(),
                })),
            ]);

            return { items, total: stats.total };
        });
    }

    private selectHistory(tx: Prisma8Transaction, userId: bigint) {
        return tx.orm.public.BalanceHistory.select(
            'id',
            'userId',
            'action',
            'amountCents',
            'balanceBeforeCents',
            'balanceAfterCents',
            'idempotencyKey',
            'createdAt'
        ).where({ userId });
    }
}
