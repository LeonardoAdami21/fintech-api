// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './interface/controllers/payments.controller';
import { IdentityModule } from '../identity/identity.module';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { AccountsModule } from '../accounts/accounts.module';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { FraudModule } from '../fraud/fraud.module';
import { OutboxModule } from 'src/shared/infrastructure/outbox/outbox.module';
import { InitiatePaymentHandler } from './application/commands/initiate-payment/initiate-payment.handler';
import { ListPaymentsQuery } from './application/queries/list-payments.query';
import { GetPaymentQuery } from './application/queries/get-payment.query';

@Module({
  imports: [IdentityModule, AccountsModule, FraudModule, OutboxModule],
  providers: [
    PrismaService,
    InitiatePaymentHandler,
    ListPaymentsQuery,
    GetPaymentQuery,
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
