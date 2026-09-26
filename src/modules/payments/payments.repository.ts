import { Inject, Injectable } from '@nestjs/common';

import { type Prisma8Transaction, PrismaService } from '../../core/database/prisma.service.js';

export type AtomicDebitRow = {
    id: bigint;
    balanceBeforeCents: bigint;
    balanceAfterCents: bigint;
};

export type ExistingHistory = {
    id: string;
    amountCents: bigint;
    balanceAfterCents: bigint;
    idempotencyKey: string | null;
};

type TransactionHandle = Prisma8Transaction;

@Injectable()
export class PaymentsRepository {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    transaction<TResult>(callback: (tx: TransactionHandle) => Promise<TResult>): Promise<TResult> {
        return this.prisma.transaction(callback);
    }

    async findExistingHistory(
        tx: TransactionHandle,
        userId: bigint,
        idempotencyKey: string
    ): Promise<ExistingHistory | null> {
        return tx.orm.public.BalanceHistory.select(
            'id',
            'amountCents',
            'balanceAfterCents',
            'idempotencyKey'
        )
            .where({ userId, idempotencyKey })
            .first();
    }

    async debitIfEnoughFunds(
        tx: TransactionHandle,
        userId: bigint,
        amount: bigint
    ): Promise<AtomicDebitRow | null> {
        const plan = this.prisma.db.raw.sql`
      UPDATE users
      SET balance_cents = balance_cents - ${amount},
          updated_at = now()
      WHERE id = ${userId}
        AND balance_cents >= ${amount}
      RETURNING
        id,
        balance_cents + ${amount} AS "balanceBeforeCents",
        balance_cents AS "balanceAfterCents"
    `
            .returnsRow({
                id: 'pg/int8@1',
                balanceBeforeCents: 'pg/int8@1',
                balanceAfterCents: 'pg/int8@1',
            })
            .build();

        const [updatedUser] = await this.queryTx<AtomicDebitRow>(tx, plan);
        return updatedUser ?? null;
    }

    async userExists(tx: TransactionHandle, userId: bigint): Promise<boolean> {
        const user = await tx.orm.public.User.select('id').first({ id: userId });
        return Boolean(user);
    }

    async insertDebitHistory(
        tx: TransactionHandle,
        input: {
            userId: bigint;
            amount: bigint;
            balanceBeforeCents: bigint;
            balanceAfterCents: bigint;
            idempotencyKey: string | null;
        }
    ): Promise<{ id: string }> {
        return tx.orm.public.BalanceHistory.select('id').create({
            userId: input.userId,
            action: 'DEBIT',
            amountCents: input.amount,
            balanceBeforeCents: input.balanceBeforeCents,
            balanceAfterCents: input.balanceAfterCents,
            idempotencyKey: input.idempotencyKey,
        });
    }

    isUniqueConstraintError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'sqlState' in error &&
            error.sqlState === '23505'
        );
    }

    private async queryTx<TRow>(tx: TransactionHandle, plan: unknown): Promise<TRow[]> {
        const rows: TRow[] = [];

        for await (const row of tx.query(plan)) {
            rows.push(row as TRow);
        }

        return rows;
    }
}
