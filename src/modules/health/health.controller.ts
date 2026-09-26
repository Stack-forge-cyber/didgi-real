import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';

import { ErrorResponseDto } from '../../core/swagger/error-response.dto.js';

import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller()
export class HealthController {
    constructor(private readonly health: HealthService) {}

    @Get('/health')
    @ApiOkResponse({
        schema: {
            example: { status: 'ok' },
        },
    })
    healthCheck(): { status: 'ok' } {
        return { status: 'ok' };
    }

    @Get('/ready')
    @ApiOkResponse({
        schema: {
            example: { status: 'ready', checks: { database: 'ok' } },
        },
    })
    @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
    async readinessCheck(): Promise<{
        status: 'ready';
        checks: { database: 'ok' };
    }> {
        await this.health.checkDatabase();

        return { status: 'ready', checks: { database: 'ok' } };
    }
}
