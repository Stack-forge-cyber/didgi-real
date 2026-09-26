import { ApiProperty } from '@nestjs/swagger';

export class WithdrawRequestDto {
    @ApiProperty({
        type: Number,
        example: 10_000,
        minimum: 1,
        description: 'Amount in minor units. 10000 means $100.00.',
    })
    amountCents!: number;
}

export class BalanceResponseDto {
    @ApiProperty({ type: Number, example: 1 })
    userId!: number;

    @ApiProperty({ type: Number, example: 10_000 })
    balanceCents!: number;

    @ApiProperty({ type: String, example: '100.00' })
    balance!: string;
}

export class WithdrawResponseDto extends BalanceResponseDto {
    @ApiProperty({ type: Number, example: 10_000 })
    amountCents!: number;

    @ApiProperty({ type: String, example: '7f2d2a89-b49d-465f-9e60-357594b22a2a' })
    historyId!: string;

    @ApiProperty({ type: String, example: 'purchase-123', required: false, nullable: true })
    idempotencyKey!: string | null;
}

export class BalanceHistoryItemDto {
    @ApiProperty({ type: String, example: '7f2d2a89-b49d-465f-9e60-357594b22a2a' })
    id!: string;

    @ApiProperty({ type: Number, example: 1 })
    userId!: number;

    @ApiProperty({ type: String, example: 'DEBIT' })
    action!: string;

    @ApiProperty({ type: Number, example: 10_000 })
    amountCents!: number;

    @ApiProperty({ type: Number, example: 10_000 })
    balanceBeforeCents!: number;

    @ApiProperty({ type: Number, example: 0 })
    balanceAfterCents!: number;

    @ApiProperty({ type: String, example: 'purchase-123', required: false, nullable: true })
    idempotencyKey!: string | null;

    @ApiProperty({ type: String, example: '2026-09-25T12:00:00.000Z' })
    createdAt!: string;
}

export class PaginationResponseDto {
    @ApiProperty({ type: Number, example: 20 })
    limit!: number;

    @ApiProperty({ type: Number, example: 0 })
    offset!: number;

    @ApiProperty({ type: Number, example: 125 })
    total!: number;

    @ApiProperty({ type: Boolean, example: true })
    hasNext!: boolean;
}

export class BalanceHistoryResponseDto {
    @ApiProperty({ type: () => [BalanceHistoryItemDto] })
    items!: BalanceHistoryItemDto[];

    @ApiProperty({ type: () => PaginationResponseDto })
    pagination!: PaginationResponseDto;
}
