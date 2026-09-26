import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/database/prisma.module.js';

import { PaymentsRepository } from './payments.repository.js';
import { PaymentsService } from './payments.service.js';

@Module({
    imports: [PrismaModule],
    providers: [PaymentsRepository, PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule {}
