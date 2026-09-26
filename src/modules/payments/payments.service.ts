import { Inject, Injectable } from '@nestjs/common';

import {
    idempotencyConflictError,
    insufficientFundsError,
    userNotFoundError,
} from '../../core/errors/domain-errors.js';
import { formatMoney } from '../../core/money/format-money.js';

import { type ExistingHistory, PaymentsRepository } from './payments.repository.js';

type WithdrawResult = {
    userId: number;
    amountCents: number;
    balanceCents: number;
    balance: string;
    historyId: string;
    idempotencyKey: string | null;
};

@Injectable()
export class PaymentsService {
    constructor(
        @Inject(PaymentsRepository) private readonly paymentsRepository: PaymentsRepository
    ) {}

    async withdraw(
        userId: bigint,
        amountCents: number,
        idempotencyKey?: string
    ): Promise<WithdrawResult> {
        const amount = BigInt(amountCents);

        const result = await this.paymentsRepository.transaction(async (tx) => {
            const existing = idempotencyKey
                ? await this.paymentsRepository.findExistingHistory(tx, userId, idempotencyKey)
                : null;

            if (existing) {
                this.assertSameIdempotentAmount(existing, amount);
                return this.toWithdrawResult(
                    userId,
                    existing.amountCents,
                    existing.balanceAfterCents,
                    existing.id,
                    existing.idempotencyKey
                );
            }

            const updatedUser = await this.paymentsRepository.debitIfEnoughFunds(
                tx,
                userId,
                amount
            );

            if (!updatedUser) {
                await this.throwDebitFailure(tx, userId);
                throw new Error('Unreachable debit failure branch');
            }

            try {
                const history = await this.paymentsRepository.insertDebitHistory(tx, {
                    userId,
                    amount,
                    balanceBeforeCents: updatedUser.balanceBeforeCents,
                    balanceAfterCents: updatedUser.balanceAfterCents,
                    idempotencyKey: idempotencyKey ?? null,
                });

                return this.toWithdrawResult(
                    userId,
                    amount,
                    updatedUser.balanceAfterCents,
                    history.id,
                    idempotencyKey ?? null
                );
            } catch (error) {
                if (this.paymentsRepository.isUniqueConstraintError(error) && idempotencyKey) {
                    const conflicted = await this.paymentsRepository.findExistingHistory(
                        tx,
                        userId,
                        idempotencyKey
                    );
                    if (conflicted) {
                        this.assertSameIdempotentAmount(conflicted, amount);
                        return this.toWithdrawResult(
                            userId,
                            conflicted.amountCents,
                            conflicted.balanceAfterCents,
                            conflicted.id,
                            conflicted.idempotencyKey
                        );
                    }
                }

                throw error;
            }
        });

        return result;
    }

    private assertSameIdempotentAmount(history: ExistingHistory, amount: bigint): void {
        if (history.amountCents !== amount) {
            throw idempotencyConflictError();
        }
    }

    private async throwDebitFailure(
        tx: Parameters<PaymentsRepository['userExists']>[0],
        userId: bigint
    ): Promise<never> {
        const userExists = await this.paymentsRepository.userExists(tx, userId);

        if (!userExists) {
            throw userNotFoundError(userId);
        }

        throw insufficientFundsError();
    }

    private toWithdrawResult(
        userId: bigint,
        amountCents: bigint,
        balanceCents: bigint,
        historyId: string,
        idempotencyKey: string | null
    ): WithdrawResult {
        return {
            userId: Number(userId),
            amountCents: Number(amountCents),
            balanceCents: Number(balanceCents),
            balance: formatMoney(balanceCents),
            historyId,
            idempotencyKey,
        };
    }
}
