import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConflictResponse,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '../../core/swagger/error-response.dto.js';
import { type WithdrawBody, withdrawSchema } from '../payments/dto/withdraw.dto.js';
import { PaymentsService } from '../payments/payments.service.js';

import { type UserHistoryQuery, userHistoryQuerySchema } from './dto/user-history-query.dto.js';
import { userIdSchema } from './dto/user-param.dto.js';
import {
    BalanceHistoryResponseDto,
    BalanceResponseDto,
    WithdrawRequestDto,
    WithdrawResponseDto,
} from './dto/users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('/users/:userId')
export class UsersController {
    constructor(
        private readonly users: UsersService,
        private readonly payments: PaymentsService
    ) {}

    @Get('/balance')
    @ApiOkResponse({ type: BalanceResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    getBalance(
        @Param('userId', { schema: userIdSchema }) userId: number
    ): Promise<BalanceResponseDto> {
        return this.users.getBalance(BigInt(userId));
    }

    @Get('/history')
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiOkResponse({ type: BalanceHistoryResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    getHistory(
        @Param('userId', { schema: userIdSchema }) userId: number,
        @Query({ schema: userHistoryQuerySchema }) query: UserHistoryQuery
    ): Promise<BalanceHistoryResponseDto> {
        return this.users.getHistory(BigInt(userId), query);
    }

    @Post('/withdraw')
    @ApiHeader({
        name: 'Idempotency-Key',
        required: false,
        description: 'Optional key to make client retries safe.',
        example: 'purchase-123',
    })
    @ApiBody({ type: WithdrawRequestDto })
    @ApiOkResponse({ type: WithdrawResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiConflictResponse({ type: ErrorResponseDto })
    withdraw(
        @Param('userId', { schema: userIdSchema }) userId: number,
        @Body({ schema: withdrawSchema }) body: WithdrawBody,
        @Headers('idempotency-key') idempotencyKey?: string
    ): Promise<WithdrawResponseDto> {
        return this.payments.withdraw(BigInt(userId), body.amountCents, idempotencyKey);
    }
}
