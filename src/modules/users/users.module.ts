import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/database/prisma.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
    imports: [PrismaModule, PaymentsModule],
    controllers: [UsersController],
    providers: [UsersRepository, UsersService],
})
export class UsersModule {}
