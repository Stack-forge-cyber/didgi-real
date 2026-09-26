import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ type: String, example: 'INSUFFICIENT_FUNDS' })
    code!: string;

    @ApiProperty({ type: String, example: 'Insufficient funds' })
    message!: string;

    @ApiProperty({ type: Number, example: 409 })
    statusCode!: number;

    @ApiProperty({ type: String, example: '2026-09-25T12:00:00.000Z' })
    timestamp!: string;

    @ApiProperty({ type: String, example: '/users/1/withdraw' })
    path!: string;

    @ApiProperty({
        type: String,
        example: '3023b7c8-83a0-40fa-a6b7-1310892be8ff',
    })
    requestId!: string;
}
