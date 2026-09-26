import { Inject, Injectable } from '@nestjs/common';

import { userNotFoundError } from '../../core/errors/domain-errors.js';
import { formatMoney } from '../../core/money/format-money.js';

import type { UserHistoryQuery } from './dto/user-history-query.dto.js';
import type { BalanceHistoryResponseDto, BalanceResponseDto } from './dto/users.dto.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
    constructor(@Inject(UsersRepository) private readonly usersRepository: UsersRepository) {}

    async getBalance(userId: bigint): Promise<BalanceResponseDto> {
        const user = await this.usersRepository.findBalance(userId);

        if (!user) {
            throw userNotFoundError(userId);
        }

        return {
            userId: Number(user.id),
            balanceCents: Number(user.balanceCents),
            balance: formatMoney(user.balanceCents),
        };
    }

    async getHistory(
        userId: bigint,
        pagination: UserHistoryQuery
    ): Promise<BalanceHistoryResponseDto> {
        const userExists = await this.usersRepository.exists(userId);

        if (!userExists) {
            throw userNotFoundError(userId);
        }

        const { items, total } = await this.usersRepository.findHistory(userId, pagination);

        return {
            items: items.map((item) => ({
                id: item.id,
                userId: Number(item.userId),
                action: item.action,
                amountCents: Number(item.amountCents),
                balanceBeforeCents: Number(item.balanceBeforeCents),
                balanceAfterCents: Number(item.balanceAfterCents),
                idempotencyKey: item.idempotencyKey,
                createdAt: item.createdAt.toString(),
            })),
            pagination: {
                limit: pagination.limit,
                offset: pagination.offset,
                total,
                hasNext: pagination.offset + items.length < total,
            },
        };
    }
}
