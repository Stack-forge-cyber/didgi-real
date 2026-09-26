import { describe, expect, it } from 'vitest';

import { ExistingHistory } from '../src/modules/payments/payments.repository.js';
import { PaymentsService } from '../src/modules/payments/payments.service.js';

class MemoryPaymentsRepository {
    private readonly histories = new Map<string, ExistingHistory>();

    constructor(private user: { id: bigint; balanceCents: bigint } | null) {}

    transaction = async <T>(callback: (tx: unknown) => Promise<T>) => callback({});

    findExistingHistory = async (_tx: unknown, userId: bigint, idempotencyKey: string) => {
        return this.histories.get(`${userId.toString()}:${idempotencyKey}`) ?? null;
    };

    debitIfEnoughFunds = async (_tx: unknown, userId: bigint, amount: bigint) => {
        if (!this.user || this.user.id !== userId || this.user.balanceCents < amount) {
            return null;
        }

        const before = this.user.balanceCents;
        this.user.balanceCents -= amount;

        return {
            id: userId,
            balanceBeforeCents: before,
            balanceAfterCents: this.user.balanceCents,
        };
    };

    userExists = async (_tx: unknown, userId: bigint) => {
        return this.user?.id === userId;
    };

    insertDebitHistory = async (
        _tx: unknown,
        input: {
            userId: bigint;
            amount: bigint;
            balanceBeforeCents: bigint;
            balanceAfterCents: bigint;
            idempotencyKey: string | null;
        }
    ) => {
        const history = {
            id: crypto.randomUUID(),
            amountCents: input.amount,
            balanceAfterCents: input.balanceAfterCents,
            idempotencyKey: input.idempotencyKey,
        };

        if (input.idempotencyKey) {
            this.histories.set(`${input.userId.toString()}:${input.idempotencyKey}`, history);
        }

        return { id: history.id };
    };

    isUniqueConstraintError = (error: unknown) => {
        return (
            typeof error === 'object' &&
            error !== null &&
            'sqlState' in error &&
            error.sqlState === '23505'
        );
    };
}

const createService = (repository: MemoryPaymentsRepository) =>
    new PaymentsService(repository as never);

describe('PaymentsService', () => {
    it('debits balance and writes history', async () => {
        const repository = new MemoryPaymentsRepository({ id: 1n, balanceCents: 10_000n });
        const service = createService(repository);

        await expect(service.withdraw(1n, 1_000, 'purchase-1')).resolves.toMatchObject({
            userId: 1,
            amountCents: 1_000,
            balanceCents: 9_000,
            balance: '90.00',
            idempotencyKey: 'purchase-1',
        });
    });

    it('rejects debit when funds are insufficient', async () => {
        const repository = new MemoryPaymentsRepository({ id: 1n, balanceCents: 500n });
        const service = createService(repository);

        await expect(service.withdraw(1n, 1_000)).rejects.toMatchObject({
            code: 'INSUFFICIENT_FUNDS',
            statusCode: 409,
        });
    });

    it('does not debit twice for the same idempotency key', async () => {
        const repository = new MemoryPaymentsRepository({ id: 1n, balanceCents: 10_000n });
        const service = createService(repository);

        const first = await service.withdraw(1n, 1_000, 'purchase-2');
        const second = await service.withdraw(1n, 1_000, 'purchase-2');

        expect(second).toEqual(first);
        expect(await service.withdraw(1n, 500, 'purchase-3')).toMatchObject({
            balanceCents: 8_500,
        });
    });

    it('rejects idempotency key reuse with another amount', async () => {
        const repository = new MemoryPaymentsRepository({ id: 1n, balanceCents: 10_000n });
        const service = createService(repository);

        await service.withdraw(1n, 1_000, 'purchase-4');

        await expect(service.withdraw(1n, 2_000, 'purchase-4')).rejects.toMatchObject({
            code: 'IDEMPOTENCY_CONFLICT',
            statusCode: 409,
        });
    });
});
