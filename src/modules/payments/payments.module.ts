// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './interface/controllers/payments.controller';
import { IdentityModule } from '../identity/identity.module';
import { PrismaService } from 'src/shared/infra/prisma.service';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [IdentityModule, AccountsModule],
  providers: [
    PrismaService,
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
